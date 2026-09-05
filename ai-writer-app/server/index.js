const express = require('express');
const path = require('path');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } = require('docx');
const configStore = require('./config');
const skills = require('./skills');
const llm = require('./llm');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.raw({ type: ['application/octet-stream', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], limit: '25mb' }));

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// ---------- 配置接口 ----------
app.get('/api/config', (req, res) => {
  res.json(configStore.publicConfig());
});

app.post('/api/config', (req, res) => {
  const { active, providers } = req.body || {};
  const cur = configStore.loadConfig();
  if (active && cur.providers[active]) cur.active = active;
  if (providers && typeof providers === 'object') {
    for (const key of Object.keys(cur.providers)) {
      if (providers[key]) {
        if (typeof providers[key].apiKey === 'string') cur.providers[key].apiKey = providers[key].apiKey.trim();
        if (typeof providers[key].model === 'string') cur.providers[key].model = providers[key].model.trim() || cur.providers[key].model;
        if (typeof providers[key].baseUrl === 'string' && providers[key].baseUrl.trim()) cur.providers[key].baseUrl = providers[key].baseUrl.trim();
      }
    }
  }
  configStore.saveConfig(cur);
  res.json(configStore.publicConfig());
});

// ---------- 技能信息（前端用于展示/探测是否可读） ----------
app.get('/api/modes', (req, res) => {
  res.json({
    modes: skills.ALL_MODES,
    prompts: skills.ALL_MODES.map((m) => ({ mode: m, len: skills.buildSystemPrompt(m).length }))
  });
});

// ---------- 导入 Word(.docx)：提取纯文本 ----------
// body 为 .docx 原始字节（application/octet-stream）
app.post('/api/import-docx', async (req, res) => {
  const buf = req.body;
  if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
    return res.status(400).json({ error: '未接收到文件内容' });
  }
  try {
    const result = await mammoth.extractRawText({ buffer: buf });
    const text = (result.value || '').replace(/\u0000/g, '').trim();
    if (!text) return res.status(400).json({ error: '未能从 Word 文档中提取到文字，可能为空文档或需另存为 .docx 格式。' });
    res.json({ text, chars: text.length, warnings: result.messages || [] });
  } catch (e) {
    res.status(400).json({ error: '解析 Word 失败：' + e.message });
  }
});

// =========================================================================
// 导出 Word(.docx)：公文排版，仿 模板.docx（A4、正文仿宋四号、首行缩进2字、固定行距；
// 一级标题黑体、二级楷体、三级仿宋；若为策划案则自动用其封面；文末“待确认清单”不导出）
// body: { text }
// =========================================================================
const ALIGN = AlignmentType;
// 模板用中文字体（西文/数字统一 Times New Roman）
const F = {
  body: { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '仿宋', cs: '仿宋' },
  hei:  { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '黑体', cs: '黑体' },
  kai:  { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '楷体', cs: '楷体' },
  xbs:  { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '方正小标宋简体', cs: '方正小标宋简体' }
};
const SZ = { h1: 28, note: 24, title: 44 }; // 半磅：四号14pt=28，小四12pt=24，二号22pt=44
// 去掉会残留的 markdown 符号（#、**、*、`、链接、表格竖线等）
function mdText(s) {
  return String(s || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\|/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// 把行内 markdown（加粗/代码/链接）拆成多个 run
function mdRuns(text, o = {}) {
  const font = o.font || F.body, size = o.size || SZ.h1, baseBold = !!o.bold;
  const runs = [];
  const re = /(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  const push = (s, kind) => { if (s) runs.push(new TextRun({ text: s, font, size, bold: kind === 'b' || baseBold, italics: kind === 'i' })); };
  while ((m = re.exec(text))) {
    if (m.index > last) push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) push(t.slice(2, -2), 'b');
    else if (t.startsWith('`')) push(t.slice(1, -1));
    else { const l = t.match(/^\[([^\]]+)\]\([^)]+\)$/); push(l ? l[1] : t); }
    last = m.index + t.length;
  }
  if (last < text.length) push(text.slice(last));
  if (!runs.length) runs.push(new TextRun({ text: '', font, size }));
  return runs;
}
// 正文段：固定行距 28 磅 + 首行缩进 2 字符（约 560 twips）
function para(runs, o = {}) {
  const spacing = { line: 560, lineRule: 'exact' };
  if (o.before != null) spacing.before = o.before;
  if (o.after != null) spacing.after = o.after;
  const opt = { children: runs, spacing };
  if (o.align) opt.alignment = o.align;
  if (o.break) opt.pageBreakBefore = true;
  if (!o.noIndent) opt.indent = { firstLine: 560 };
  return new Paragraph(opt);
}
// 判断某行是否为一级正文标题（“一、…”），兼容 markdown 标题前缀/加粗
function startsL1(txt) {
  return /^[一二三四五六七八九十]+[、．.]/.test(mdText(txt));
}
function isCheckHead(txt) {
  const c = mdText(txt);
  return /^待确认清单/.test(c) || (/^待确认/.test(c) && c.length <= 12);
}
// 封面用居中段落
function coverPara(text, o = {}) {
  return new Paragraph({
    alignment: ALIGN.CENTER,
    spacing: { line: 360, lineRule: 'auto', before: o.before || 0, after: o.after || 0 },
    children: [new TextRun({ text, size: o.size || SZ.title, font: o.font || F.xbs, bold: !!o.bold })]
  });
}
function coverBlank() {
  return new Paragraph({ children: [new TextRun({ text: '', size: 28, font: F.body })], spacing: { line: 360, lineRule: 'auto' } });
}
// —— Word 表格（预算等 Markdown 表格 → 真实表格）——
function tableCells(line) {
  let r = String(line || '').replace(/\s+$/, '').trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map((c) => c.trim());
}
function isTableSep(line) {
  const c = tableCells(line);
  return c.length > 0 && c.every((x) => /^:?-{2,}:?$/.test(x));
}
function buildWordTable(cellArrays) {
  const ncol = Math.max.apply(null, cellArrays.map((r) => r.length)) || 1;
  const B = BorderStyle.SINGLE;
  const edge = { style: B, size: 4, color: '7F7F7F' };
  const rowParas = cellArrays.map((row, ri) => {
    const isHead = ri === 0;
    const cells = [];
    for (let ci = 0; ci < ncol; ci++) {
      const txt = row[ci] != null ? row[ci] : '';
      cells.push(new TableCell({
        borders: { top: edge, bottom: edge, left: edge, right: edge },
        verticalAlign: VerticalAlign.CENTER,
        shading: isHead ? { fill: 'EFEFEF' } : undefined,
        width: { size: Math.round(100 / ncol), type: WidthType.PERCENTAGE },
        children: [new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: txt, font: F.body, size: SZ.h1, bold: isHead })]
        })]
      }));
    }
    return new TableRow({ children: cells });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rowParas
  });
}

// 单行正文 -> 段落（或 null）
function bodyLinePara(raw, o = {}) {
  const line = raw.replace(/\s+$/, '');
  const trim = line.trim();
  if (!trim) return null;
  const level = (/^(#{1,6})\s+/.test(trim)) ? (+trim.match(/^(#{1,6})\s+/)[1].length) : 0;
  const contentPlain = mdText(trim.replace(/^#{1,6}\s*/, ''));
  if (!contentPlain) return null;
  // 中文序号标题：一级黑体、二级楷体（不随 md 层级改变）
  if (/^[一二三四五六七八九十]+[、．.]/.test(contentPlain)) return para([new TextRun({ text: contentPlain, font: F.hei, size: SZ.h1 })], { break: o.break });
  if (/^（[一二三四五六七八九十]+）/.test(contentPlain)) return para([new TextRun({ text: contentPlain, font: F.kai, size: SZ.h1 })], { break: o.break });
  // 分隔线
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trim)) return null;
  // markdown 标题：一级黑体、二级楷体、三级+仿宋
  if (level > 0) {
    const f = level <= 1 ? F.hei : (level === 2 ? F.kai : F.body);
    return para([new TextRun({ text: contentPlain, font: f, size: SZ.h1 })], { break: o.break });
  }
  // 表格行（预算表等）：单元格用全角空格分隔
  if (/^\s*\|.*\|\s*$/.test(line)) {
    const cells = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()).filter((c) => c && !/^:?-+:?$/.test(c));
    if (cells.length) return para([new TextRun({ text: cells.join('　'), size: SZ.h1, font: F.body })], { noIndent: true, break: o.break });
    return null;
  }
  // 列表 / 编号 / 正文
  const bullet = trim.match(/^([-*•])\s+(.*)$/);
  const num = trim.match(/^(\d+)[.、)]\s+(.*)$/);
  if (bullet) {
    const runs = [new TextRun({ text: '• ', font: F.body, size: SZ.h1 })].concat(mdRuns(bullet[2], { font: F.body }));
    return para(runs, { noIndent: true, break: o.break });
  }
  if (num) return para(mdRuns(trim, { font: F.body }), { break: o.break });
  return para(mdRuns(trim, { font: F.body }), { break: o.break });
}
function buildDocParas(md) {
  let lines = String(md || '').replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''));
  // 文末“待确认清单”部分不写入 Word
  for (let i = 0; i < lines.length; i++) { if (isCheckHead(lines[i])) { lines = lines.slice(0, i); break; } }
  // 找正文起点（首个“一、…”），之前视为封面（直接用文案里的封面）
  let bodyStart = lines.length;
  for (let i = 0; i < lines.length; i++) { if (startsL1(lines[i])) { bodyStart = i; break; } }
  const coverLines = lines.slice(0, bodyStart).map(mdText).filter(Boolean);
  const isCover = bodyStart < lines.length && coverLines.length >= 2 && coverLines.length <= 12 &&
    /策\s*划\s*书|策划书/.test(coverLines.slice(0, 8).join(''));
  const paras = [];
  if (isCover) {
    const ci = coverLines.findIndex((l) => /策\s*划\s*书/.test(l));
    const big = (ci >= 0 ? coverLines.slice(0, ci) : coverLines);
    paras.push(coverBlank(), coverBlank());
    big.forEach((l, ix) => { paras.push(coverPara(l, { before: ix === 0 ? 200 : 0, after: 240 })); });
    if (ci >= 0) {
      paras.push(coverPara(coverLines[ci], { before: 160, after: 520 }));
    } else {
      paras.push(coverBlank());
    }
    const sub = (ci >= 0 ? coverLines.slice(ci + 1) : []);
    sub.forEach((l) => {
      const hei = /^(主办|承办|协办|主办方)/.test(l);
      paras.push(hei
        ? coverPara(l, { font: F.body, size: SZ.h1, bold: true, after: 120 })
        : coverPara(l, { font: F.kai, size: SZ.note, after: 120 }));
    });
  }
  const bodyLines = (isCover ? lines.slice(bodyStart) : lines);
  let needBreak = isCover, firstDone = false;
  const markDone = () => { if (!firstDone) { firstDone = true; needBreak = false; } };
  let i = 0;
  const n = bodyLines.length;
  while (i < n) {
    const raw = bodyLines[i];
    const t = raw.trim();
    if (!t) { i++; continue; }
    // 连续表格行 -> 真实 Word 表格
    if (/^\s*\|/.test(t) && /\|/.test(raw)) {
      const cellRows = [];
      while (i < n) {
        const rt = bodyLines[i].trim();
        if (!/^\s*\|/.test(rt)) break;
        if (!isTableSep(bodyLines[i])) cellRows.push(tableCells(bodyLines[i]));
        i++;
      }
      if (cellRows.length) {
        if (needBreak) paras.push(new Paragraph({ children: [new TextRun({ text: '', font: F.body, size: SZ.h1 })], spacing: { line: 560, lineRule: 'exact' }, pageBreakBefore: true }));
        markDone();
        paras.push(buildWordTable(cellRows));
      }
      continue;
    }
    const p = bodyLinePara(raw, { break: needBreak });
    if (p) { markDone(); paras.push(p); }
    i++;
  }
  return paras;
}
app.post('/api/export-docx', async (req, res) => {
  const text = ((req.body || {}).text || '').replace(/\r\n/g, '\n');
  if (!text.trim()) return res.status(400).json({ error: '内容为空' });
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1800, bottom: 1440, left: 1800, header: 851, footer: 992 }
        }
      },
      children: buildDocParas(text)
    }]
  });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="export.docx"');
  res.send(buffer);
});


// ---------- 测试连接（轻量，不注入技能长提示词） ----------
app.post('/api/test', async (req, res) => {
  const provider = (req.body || {}).provider;
  try {
    llm.assertReady(provider);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    const reply = await llm.completeChat({
      provider,
      messages: [
        { role: 'system', content: '你是一个连通性测试助手，请只回复两个字：正常。' },
        { role: 'user', content: '测试' }
      ],
      temperature: 0
    });
    res.json({ ok: true, reply: (reply || '').slice(0, 80) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- 生成正文 / 续写（单一流式对话） ----------
// body: { mode, messages:[{role,content}], temperature? }
// 其中 messages 最后一条通常是用户对当前草稿/追加的需求。
app.post('/api/chat', async (req, res) => {
  const { mode, messages, temperature, provider } = req.body || {};
  if (!skills.ALL_MODES.includes(mode)) return res.status(400).json({ error: '无效的 mode' });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages 不能为空' });

  // 在写出响应头之前先校验配置，缺失 Key / 提供商不存在时返回干净的 JSON 错误
  try {
    llm.assertReady(provider);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const system = skills.buildSystemPrompt(mode);
  const full = [{ role: 'system', content: system }, ...messages];

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no'
  });

  let clientGone = false;
  const ctrl = new AbortController();
  // 客户端(浏览器)真正断开时才停止回写。
  // 注意：不能用 req 'close'——它会在请求体读完后、流式返回开始前就触发，导致全部内容被丢弃。
  res.on('close', () => {
    if (!res.writableEnded) { clientGone = true; ctrl.abort(); }
  });

  try {
    await llm.streamChat({
      provider,
      messages: full,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      signal: ctrl.signal,
      onDelta: (part) => {
        if (clientGone) return;
        res.write(part);
      }
    });
    if (!clientGone) res.end();
  } catch (e) {
    if (res.headersSent && !res.writableEnded) {
      try { res.end('\n\n[错误] ' + e.message); } catch (err) {}
    } else {
      try { res.status(500).json({ error: e.message }); } catch (err) {}
    }
  }
});

const PORT = process.env.PORT || 5503;
app.listen(PORT, () => {
  const url = `http://127.0.0.1:${PORT}`;
  const root = path.join(__dirname, '..', '..');
  const tty = !!process.stdout.isTTY;
  const c = (s, code) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
  const bold = (s) => c(s, '1');
  const green = (s) => c(s, '32'), yellow = (s) => c(s, '33');
  const blue = (s) => c(s, '34'), magenta = (s) => c(s, '35'), cyan = (s) => c(s, '36');
  const line = (tty ? '━' : '=').repeat(56);
  let provider = '';
  try {
    const cfg = configStore.loadConfig();
    const p = cfg && cfg.providers && cfg.providers[cfg.active];
    provider = p ? p.label : '';
  } catch (e) { /* 忽略配置读取失败 */ }
  const out = [
    '',
    '  ' + magenta('◆') + '  ' + bold('智农 · AI 组织部 写作助手') + '  ' + yellow('v1.1'),
    '  ' + line,
    '  ' + green('🚀 服务已启动：') + cyan(bold(url)),
    '  ' + yellow('📁 技能根目录：') + root,
    '',
    '  ' + blue('📋 功能一览'),
    '  ' + '    ' + ['🧭 策划案', '💬 QQ 推送', '📱 微信推送', '⏱ 学时申请/认定'].join('   ·   '),
    '  ' + '    ' + ['🖼 配图提示词', '✍️ 选中改写', '🗂 我的存档', '🎨 多主题', '📄 Word 公文导出'].join('   ·   '),
    '',
    '  ' + blue('🔑 当前模型：') + (provider || yellow('未配置（点右上角 ⚙ 模型设置填写 API Key）')),
    '  ' + yellow('💡 提示：') + '在浏览器打开上方地址，开始你的智能写作。',
    ''
  ];
  console.log(out.join('\n'));
});
