const express = require('express');
const path = require('path');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');
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

// ---------- 导出 Word(.docx)：由纯文本生成 ----------
// body: { text }
app.post('/api/export-docx', async (req, res) => {
  const text = ((req.body || {}).text || '').replace(/\r\n/g, '\n');
  if (!text.trim()) return res.status(400).json({ error: '内容为空' });
  const lines = text.split('\n');
  const children = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { children.push(new Paragraph({})); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      children.push(new Paragraph({
        heading: 'Heading' + level,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: h[2], bold: true })],
        size: (level <= 1 ? 40 : level <= 2 ? 34 : 30)
      }));
      continue;
    }
    const b = line.match(/^\s*[-*•]\s+(.*)$/);
    if (b) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: stripMd(b[1]) })]
      }));
      continue;
    }
    const num = line.match(/^\s*(\d+)[.、)]\s+(.*)$/);
    if (num) {
      children.push(new Paragraph({
        numbering: { reference: 'olist', level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: stripMd(num[2]) })]
      }));
      continue;
    }
    children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: stripMd(line) })] }));
  }
  const doc = new Document({
    numbering: { config: [{ reference: 'olist', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: 'start' }] }] },
    sections: [{ children }]
  });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="export.docx"');
  res.send(buffer);
});

function stripMd(s) {
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|/g, '');
}

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
  console.log(`AI 写作助手已启动：http://127.0.0.1:${PORT}`);
  console.log(`技能根目录：${path.join(__dirname, '..', '..')}`);
});
