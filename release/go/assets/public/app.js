/* =========================================================================
   智农团委 · AI 写作助手 前端逻辑
   ========================================================================= */

/* ---------- time_skill：学时申请 / 学时认定 字段模板 ---------- */
const TIME_TYPE_OPTS = [
  { value: 'apply', label: '学时申请 · 生成申请表' },
  { value: 'certify', label: '学时认定 · 生成认定表' }
];
const CAT_OPTS = ['德育实践', '智育实践', '体育实践', '劳育实践', '美育实践', '公益服务'];
const FORM_OPTS = ['演出', '晚会', '讲座', '展览', '线上征集', '其他'];
const TIME_APPLY_FIELDS = [
  { k: 'aCat', label: '活动分类', grp: 'apply', opts: CAT_OPTS },
  { k: 'aName', label: '活动名称', grp: 'apply', ph: '≤16字，建议"智农院XXX观众/选手/志愿者…"' },
  { k: 'aLvl', label: '活动级别', grp: 'apply', opts: ['院级', '校级', '班级', '省级', '国家级'] },
  { k: 'aForm', label: '活动形式', grp: 'apply', opts: FORM_OPTS },
  { k: 'aPlace', label: '活动地点', grp: 'apply', ph: '线上 / 具体教室' },
  { k: 'aHead', label: '预计招募人数', grp: 'apply', ph: '如 100' },
  { k: 'aRegS', label: '报名开始时间', grp: 'apply', ph: 'YYYY-MM-DD HH:MM' },
  { k: 'aRegE', label: '报名结束时间', grp: 'apply', ph: 'YYYY-MM-DD HH:MM（须早于活动开始）' },
  { k: 'aStart', label: '活动开始时间', grp: 'apply', ph: 'YYYY-MM-DD HH:MM' },
  { k: 'aEnd', label: '活动结束时间', grp: 'apply', ph: 'YYYY-MM-DD HH:MM' },
  { k: 'aCollege', label: '可参与学院', grp: 'apply', ph: '不限填"所有学院"' },
  { k: 'aGrade', label: '可参与年级', grp: 'apply', ph: '不限填"所有年级"' },
  { k: 'aJoin', label: '参与方式', grp: 'apply', opts: ['观众', '选手', '志愿者', '会务人员', '参与人员'] },
  { k: 'aRegWay', label: '报名方式', grp: 'apply', opts: ['报名需审核', '报名无需审核，人满即止'] },
  { k: 'aSign', label: '需要签退', grp: 'apply', opts: ['是', '否'] },
  { k: 'aContact', label: '活动联系人', grp: 'apply', ph: '姓名 + 学号' },
  { k: 'aPhone', label: '活动联系方式', grp: 'apply', ph: '手机号' },
  { k: 'aHours', label: '申请学时数量', grp: 'apply', ph: '先与辅导员沟通，通常 1~2' },
  { k: 'aPoints', label: '申请积分数量', grp: 'apply', ph: '先与辅导员沟通，通常 1~2' },
  { k: 'aLabor', label: '单人服务时长（劳育）', grp: 'apply', ph: '劳育需填，如 3 小时 → 0.5 学时' },
  { k: 'aIntro', label: '活动简介', grp: 'apply', ph: '200字内，须含完整活动名称与参与方式', big: true }
];
const TIME_CERTIFY_FIELDS = [
  { k: 'cCat', label: '活动分类', grp: 'certify', opts: CAT_OPTS },
  { k: 'cName', label: '活动名称', grp: 'certify', ph: '以第二课堂发布名称为准' },
  { k: 'cHours', label: '学时数量', grp: 'certify', ph: '须与申请一致' },
  { k: 'cPoints', label: '积分数量', grp: 'certify', ph: '须与申请一致' },
  { k: 'cPlace', label: '活动地点', grp: 'certify', ph: '线上 / 具体教室' },
  { k: 'cStart', label: '活动开始时间', grp: 'certify', ph: 'YYYY-MM-DD HH:MM' },
  { k: 'cEnd', label: '活动结束时间', grp: 'certify', ph: 'YYYY-MM-DD HH:MM' },
  { k: 'cCount', label: '活动认定人数', grp: 'certify', ph: '不得大于招募人数' },
  { k: 'cForm', label: '活动形式', grp: 'certify', opts: FORM_OPTS },
  { k: 'cSummary', label: '活动总结', grp: 'certify', ph: '200~300字，须含时间、地点、事件', big: true },
  { k: 'cPhotos', label: '照片证明说明', grp: 'certify', ph: '照片说明（5M以内，可先占位）', big: true }
];

const MODES = {
  plan: {
    label: '策划案', icon: '📋', modeName: '策划案撰写',
    fields: [
      { k: 'name', label: '活动名称', ph: '如：××× 活动 / 结项答辩' },
      { k: 'theme', label: '活动主题标语', ph: '（可选，留空由你按对仗句式拟定）' },
      { k: 'time', label: '活动时间', ph: '如 2026年X月X日 或 X月X日至X月X日' },
      { k: 'place', label: '活动地点', ph: '线下填具体教室，线上填"线上"' },
      { k: 'audience', label: '活动对象', ph: '如 24、25级各团支部团支书' },
      { k: 'count', label: '活动人数', ph: '如 预计约XX人' },
      { k: 'content', label: '活动内容 / 形式', ph: '简要描述活动形式与参与要求', big: true },
      { k: 'budget', label: '经费预算', ph: '科目 + 金额；留空由你按知识库拟列' },
      { k: 'nature', label: '活动性质', ph: '请选择活动性质', opts: ['线下仪式类', '线下汇报评比类', '线上征集类'] }
    ]
  },
  qq: {
    label: 'QQ 空间推送', icon: '💬', modeName: 'QQ 空间推送',
    fields: [
      { k: 'department', label: '所属部门', ph: '请选择所属部门', opts: ['学习部', '体育部', '文艺部', '生活部', '团委组织部', '分党校', '青协红会', 'AI工坊', '全媒体中心', '外联部', '学院综合'] },
      { k: 'pushType', label: '推送类型', ph: '请选择推送类型', opts: ['活动预告', '活动回顾', '节日科普', '日常栏目', '通知公告'] },
      { k: 'name', label: '活动名称 / 主题', ph: '可帮起对仗式主题句' },
      { k: 'time', label: '活动时间', ph: '如 11月1日晚18:30-20:00' },
      { k: 'place', label: '活动地点', ph: '润泽园/汇贤楼/博远楼/操场/大学生活动中心…' },
      { k: 'audience', label: '面向对象', ph: '全体学生 / 某年级 / 参赛者…' },
      { k: 'reward', label: '奖励激励', ph: '学时 / 奖品 / 证书 / 加分' },
      { k: 'register', label: '报名方式', ph: '扫码 / 加群 / 填表 / 转发' },
      { k: 'content', label: '活动内容 / 环节', ph: '活动流程、赛制、节目单、互动环节', big: true },
      { k: 'organizer', label: '主办 / 协办方', ph: '（可选）' }
    ]
  },
  wechat: {
    label: '微信推送', icon: '📱', modeName: '微信公众号推送',
    fields: [
      { k: 'articleType', label: '文章类型 / 板块', ph: '请选择文章类型', opts: ['活动预告', '活动总结', '捷报获奖', '榜样人物', '社会实践', '党建思政', '通知公告', '节气图文'] },
      { k: 'event', label: '一句话要发的活动 / 事件', ph: '如：我院2025级新生辩论赛开始报名啦', big: true },
      { k: 'aim', label: '本次目的', ph: '请选择本次目的', opts: ['宣传成绩', '树榜样', '通知活动', '党建教育', '招生迎新', '毕业就业', '记录过程'] },
      { k: 'reader', label: '目标读者', ph: '请选择目标读者', opts: ['在校生', '家长考生', '校友', '用人单位', '师生内部'] },
      { k: 'info', label: '已掌握的信息 / 素材', ph: '活动全名、时间地点、成绩数据、名单、原声寄语、报名渠道等', big: true }
    ]
  },
  time: {
    label: '学时', icon: '⏱', modeName: '学时申请 / 认定',
    fields: [
      { k: 'type', label: '办理类型', grp: 'both', opts: TIME_TYPE_OPTS },
      ...TIME_APPLY_FIELDS,
      ...TIME_CERTIFY_FIELDS
    ]
  }
};
const MODE_ORDER = ['plan', 'qq', 'wechat', 'time'];

const state = { mode: 'plan', view: 'edit', running: false, selStart: 0, selEnd: 0 };
const $ = (id) => document.getElementById(id);

const editor = $('editor');
const previewEl = $('preview');
const editPane = $('editPane');
const previewPane = $('previewPane');
const reviseBar = $('reviseBar');
const reviseInput = $('reviseInput');
const plainOut = $('plainOut');
const plainPane = $('plainPane');

/* ================= 通用工具 ================= */
let toastTimer = null;
function toast(msg, kind = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ================= 简易 Markdown 渲染 ================= */
function renderInline(src) {
  let s = escapeHtml(src);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function mdRowCells(row) {
  let r = String(row || '').trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map((c) => c.trim());
}
function isSepRow(row) {
  const cells = mdRowCells(row);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}
function renderMdTable(rows) {
  let html = '<table>';
  const body = rows.filter((r) => !isSepRow(r));
  if (rows.some(isSepRow) && body.length) {
    const head = body.shift();
    html += '<thead><tr>' + mdRowCells(head).map((c) => '<th>' + renderInline(c) + '</th>').join('') + '</tr></thead>';
  }
  if (body.length) {
    html += '<tbody>';
    body.forEach((r) => { html += '<tr>' + mdRowCells(r).map((c) => '<td>' + renderInline(c) + '</td>').join('') + '</tr>'; });
    html += '</tbody>';
  }
  html += '</table>';
  return html;
}
function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].replace(/\r$/, '').trim();
    if (!t) { i++; continue; }
    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${renderInline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { out.push('<hr/>'); i++; continue; }
    if (/^\s*\|/.test(t)) {
      const rows = [];
      while (i < lines.length) {
        const rt = lines[i].replace(/\r$/, '').trim();
        if (!rt) { i++; continue; }
        if (!/^\s*\|/.test(rt)) break;
        rows.push(rt); i++;
      }
      if (rows.length) out.push(renderMdTable(rows));
      continue;
    }
    if (t.startsWith('>')) {
      const q = [];
      while (i < lines.length) {
        const qt = lines[i].trim();
        if (!qt.startsWith('>')) break;
        q.push(qt.replace(/^>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + q.map((x) => renderInline(x)).join('<br>') + '</blockquote>');
      continue;
    }
    const li = t.match(/^([-*•])\s+(.+)$/);
    const num = t.match(/^(\d+)[.、)]\s+(.+)$/);
    if (li || num) {
      const ol = !!num;
      out.push('<' + (ol ? 'ol' : 'ul') + '>');
      while (i < lines.length) {
        const lt = lines[i].replace(/\r$/, '').trim();
        if (!lt) { i++; continue; }
        const a = lt.match(/^([-*•])\s+(.+)$/);
        const b = lt.match(/^(\d+)[.、)]\s+(.+)$/);
        if (!a && !b) break;
        if (ol && b) { out.push('<li>' + renderInline(b[2]) + '</li>'); i++; }
        else if (!ol && a) { out.push('<li>' + renderInline(a[2]) + '</li>'); i++; }
        else break;
      }
      out.push('</' + (ol ? 'ol' : 'ul') + '>');
      continue;
    }
    out.push('<p>' + renderInline(t) + '</p>');
    i++;
  }
  return out.join('\n');
}
function refreshPreview() {
  if (previewEl) previewEl.innerHTML = renderMarkdown(editor.value);
  const po = $('plainOut');
  if (po) po.value = markdownToPlain(editor.value);
}
function refreshPlain() { const po = $('plainOut'); if (po) po.value = markdownToPlain(editor.value); }

/* 把 Markdown 源转成纯文本（去符号），用于复制/导出 txt */
function markdownToPlain(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { out.push(''); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { out.push('──────────'); continue; }
    let s = raw
      .replace(/^#{1,6}\s+/, '')           // 标题符号
      .replace(/^\s*[-*•]\s+/, '· ')       // 无序列表
      .replace(/^\s*(\d+)[.、)]\s+/, '$1. ') // 有序列表
      .replace(/^>\s?/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\|/g, ' | ');              // 表格单元格用分隔符
    // 去掉表格分隔行（--- 组成的行）
    if (/^(\s*\|?\s*:?-+:?\s*\|?\s*)+$/.test(s) && s.includes('---')) continue;
    s = s.replace(/\s+/g, ' ').trim();
    out.push(s);
  }
  // 合并表格分隔符号
  let txt = out.join('\n');
  txt = txt.replace(/\n(\s*\|.*\|)\n/g, '\n$1\n'); // 保留
  return txt.replace(/\n{3,}/g, '\n\n').trim();
}
function refreshPlain() {
  $('plainOut').value = markdownToPlain(editor.value);
}
/* ================= 模式 UI ================= */
function buildModeTabs() {
  const wrap = $('modeTabs');
  wrap.innerHTML = '';
  for (const m of MODE_ORDER) {
    const d = MODES[m];
    const b = document.createElement('button');
    b.className = 'mode-btn' + (m === state.mode ? ' active' : '');
    b.innerHTML = `<span class="mi">${d.icon}</span><span class="ml">${d.label}</span>`;
    b.onclick = () => switchMode(m);
    wrap.appendChild(b);
  }
}
function switchMode(m) {
  if (state.running) { toast('正在生成中，请稍候…'); return; }
  state.mode = m;
  setView('edit');
  buildModeTabs();
  buildFields();
  updateContextButtons();
}
function buildFields() {
  const d = MODES[state.mode];
  const box = $('modeFields');
  box.innerHTML = '';
  for (const f of d.fields) {
    const div = document.createElement('div');
    div.className = 'field';
    div.dataset.grp = f.grp || 'both';
    const lbl = document.createElement('label');
    lbl.textContent = f.label;
    let input;
    if (Array.isArray(f.opts) && f.opts.length) {
      input = document.createElement('select');
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = f.ph || '请选择…';
      input.appendChild(ph);
      f.opts.forEach((o) => {
        const op = document.createElement('option');
        if (o && typeof o === 'object') { op.value = o.value; op.textContent = o.label; }
        else { op.value = o; op.textContent = o; }
        input.appendChild(op);
      });
    } else if (f.big) {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }
    input.dataset.k = f.k;
    if (!Array.isArray(f.opts) && f.ph) input.placeholder = f.ph;
    div.appendChild(lbl);
    div.appendChild(input);
    box.appendChild(div);
  }
  if (state.mode === 'time') bindTimeFilter();
}
// time 模式：根据“办理类型”只显示申请或认定一组字段
function activeTimeGroup() {
  const el = document.querySelector('#modeFields select[data-k="type"]');
  return (el && el.value === 'certify') ? 'certify' : 'apply';
}
function bindTimeFilter() {
  const el = document.querySelector('#modeFields select[data-k="type"]');
  if (!el) return;
  el.addEventListener('change', applyTimeFilter);
  if (!el.value) el.value = 'apply';
  applyTimeFilter();
}
function applyTimeFilter() {
  const g = activeTimeGroup();
  document.querySelectorAll('#modeFields .field').forEach((div) => {
    const grp = div.dataset.grp || 'both';
    div.style.display = (grp === 'both' || grp === g) ? '' : 'none';
  });
}
function readFields() {
  const obj = {};
  const box = $('modeFields');
  for (const f of MODES[state.mode].fields) {
    const el = box.querySelector(`[data-k="${f.k}"]`);
    obj[f.k] = el ? el.value.trim() : '';
  }
  return { obj, note: $('extraNote').value.trim() };
}

function importedPlanText() {
  return $('importText').value.trim();
}

function buildUserMessage(obj, note) {
  const plan = importedPlanText();
  const L = [];
  if (state.mode === 'plan') {
    L.push('请按以下信息生成一份完整活动策划案：');
    L.push('【活动名称】：' + (obj.name || '（待定，请用占位符）'));
    L.push('【活动主题标语】：' + (obj.theme || '（未提供，由你按对仗句式拟定）'));
    L.push('【活动时间】：' + (obj.time || '（待定）'));
    L.push('【活动地点】：' + (obj.place || '（待定）'));
    L.push('【活动对象】：' + (obj.audience || '（待定）'));
    L.push('【活动人数】：' + (obj.count || '（待定）'));
    L.push('【活动内容】：' + (obj.content || '（待定）'));
    L.push('【经费预算】：' + (obj.budget || '（如无，按知识库常见科目拟列）'));
    L.push('【活动性质】：' + (obj.nature || '（待定）'));
    L.push('\n要求：严格套用固定模板结构（封面→背景→目的→时间→地点→对象→内容→流程→应急→预算→附件），**不需要落款**，使用学院特有公文话术与政治表述，并在结尾附"待确认清单"。');
  } else if (state.mode === 'qq') {
    L.push('请用"南京农业大学智慧农业学院（人工智能学院）"学生组织的风格撰写一条 QQ 空间推送，信息如下：');
    if (plan) L.push('\n【已导入的活动策划案（请以其为事实依据撰写，不要改变活动的时间、地点、对象、奖励等核心信息）】\n' + plan);
    L.push('所属部门：' + (obj.department || '（留空，你判断）'));
    L.push('推送类型：' + (obj.pushType || '活动预告'));
    L.push('活动名称/主题：' + (obj.name || ''));
    L.push('活动时间：' + (obj.time || ''));
    L.push('活动地点：' + (obj.place || ''));
    L.push('面向对象：' + (obj.audience || ''));
    L.push('奖励激励：' + (obj.reward || ''));
    L.push('报名方式：' + (obj.register || ''));
    L.push('活动内容/环节：' + (obj.content || ''));
    L.push('主办/协办：' + (obj.organizer || ''));
    L.push('\n请结合活动内容原创开篇（避免"叮咚～""看过来"模板腔），随机选用一种文章结构，短句分段适合手机阅读。');
  } else if (state.mode === 'wechat') {
    L.push('请按"智慧农业学院（人工智能学院）官方微信公众号（CollegeSA&AI NAU）"的调性写一篇推送：');
    if (plan) L.push('\n【已导入的活动策划案（请以其为事实依据撰写，不要改变活动核心信息）】\n' + plan);
    L.push('文章类型/板块：' + (obj.articleType || ''));
    L.push('要发布的活动/事件：' + (obj.event || ''));
    L.push('本次目的：' + (obj.aim || ''));
    L.push('目标读者：' + (obj.reader || '在校生'));
    L.push('已掌握信息/素材：' + (obj.info || ''));
    L.push('\n请输出完整可粘贴的推文（含标题、正文、页脚信息栏）；信息不足处用合理默认值补全并在文末单列一行标注默认补充项。');
  } else if (state.mode === 'time') {
    L.push(buildTimeUserMessage(obj, note));
  }
  if (note && state.mode !== 'time') L.push('\n【补充说明】' + note);
  L.push('\n请直接输出最终正文（Markdown），不要输出交互式追问过程。');
  return L.join('\n');
}

/* 学时申请 / 认定：按办理类型生成对应表单的用户消息 */
function buildTimeUserMessage(obj, note) {
  const isCertify = obj.type === 'certify';
  const L = [];
  const add = (key, label, def) => {
    const v = (obj[key] || '').trim();
    L.push('【' + label + '】：' + (v || def || '（未填，用合理默认补全）'));
  };
  if (isCertify) {
    L.push('请按"第二课堂活动认定（附件2 认定表）"的格式生成一份完整、合规的学时认定表：');
    add('cCat', '活动分类');
    add('cName', '活动名称');
    add('cHours', '学时数量');
    add('cPoints', '积分数量');
    add('cPlace', '活动地点');
    add('cStart', '活动开始时间');
    add('cEnd', '活动结束时间');
    add('cCount', '活动认定人数');
    add('cForm', '活动形式（若为其他请具体说明）');
    add('cSummary', '活动总结（200~300字，须含时间、地点、事件）');
    add('cPhotos', '活动照片说明（先占位，活动后补 5M 以内证明图）');
    L.push('\n要求：严格套用附件2 认定表的编号结构输出全部 11 项字段；活动分类/名称/学积分须与申请保持一致，认定人数不得大于招募人数；并在末尾附附件3"学时认定名单"的表头（学号、姓名、学时）及 1 行示例，注明需按实际人员替换。');
  } else {
    L.push('请按"第二课堂活动申请（附件1 申请表）"的格式生成一份完整、合规的学时申请表：');
    add('aCat', '活动分类');
    add('aName', '活动名称');
    add('aLvl', '活动级别');
    add('aForm', '活动形式（若为其他请具体说明）');
    add('aPlace', '活动地点');
    add('aHead', '预计招募人数');
    add('aRegS', '报名开始时间');
    add('aRegE', '报名结束时间');
    add('aStart', '活动开始时间');
    add('aEnd', '活动结束时间');
    add('aCollege', '可参与学院');
    add('aGrade', '可参与年级');
    add('aJoin', '参与方式');
    add('aRegWay', '报名方式');
    add('aSign', '是否需要签退');
    add('aContact', '活动联系人（姓名 + 学号）');
    add('aPhone', '活动联系方式');
    add('aHours', '申请学时数量');
    add('aPoints', '申请积分数量');
    add('aLabor', '单人服务时长（劳育实践适用）');
    add('aIntro', '活动简介（200字内，须含完整活动名称与参与方式）');
    L.push('\n要求：严格套用附件1 申请表的编号结构输出 1~24 项全部字段；活动名称须 ≤16 字、尽量以"智农院"开头并体现参与对象性质；报名结束时间必须早于活动开始；劳育实践须在简介末尾注明"单人服务时长 X 小时"；学分数与积分默认 1~2 并标注需与辅导员沟通确认。');
  }
  if (obj.aCat === '劳育实践' || obj.cCat === '劳育实践') {
    L.push('\n【提醒】该活动分类为劳育实践，仅适用于 22 级同学，参与人员性质统一为"志愿者"，学时按单人服务时长折算（2~4小时→0.5，4小时以上→1）。');
  }
  const plan = importedPlanText();
  if (plan) L.push('\n\n【已导入的活动策划案（请以其为事实依据填写上述学时申请表/认定表，不要改变活动的名称、时间、地点、对象、人数等核心信息）】\n' + plan);
  if (note) L.push('\n【补充说明】' + note);
  return L.join('\n');
}

/* ================= 流式生成 ================= */
async function streamChat(mode, messages, onChunk) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, messages })
  });
  if (!res.ok || !res.body) {
    let msg = '请求失败 (' + res.status + ')';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (e) {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk && onChunk(full);
  }
  return full;
}

function guardRun(fn) {
  return async (...a) => {
    if (state.running) { toast('正在处理中，请稍候…'); return; }
    state.running = true;
    setRunningUI(true);
    const prev = editor.value;
    const restore = (msg) => {
      if (msg) toast(msg, 'error');
      // 出错时回滚正文，避免留下半成品
      if (editor.value !== prev) { editor.value = prev; refreshPreview(); }
    };
    const ctx = { prev, restore };
    try { await fn(ctx); }
    catch (e) { restore(e.message); }
    finally {
      state.running = false;
      setRunningUI(false);
      showStreaming(false);
      refreshPreview();
      updateContextButtons();
    }
  };
}

async function runGenerate(ctx) {
  const { obj, note } = readFields();
  if (Object.values(obj).filter(Boolean).length === 0 && !note) { ctx.restore('请先填写活动信息或补充说明'); return; }
  editor.value = '';
  showStreaming(true, '正在生成全文…');
  setView('edit');
  await streamChat(state.mode, [{ role: 'user', content: buildUserMessage(obj, note) }], (full) => {
    editor.value = full; refreshPreview();
  });
  toast('生成完成', 'ok');
}

async function runReviseAll(ctx) {
  const content = editor.value.trim();
  if (!content) { ctx.restore('正文为空，请先生成内容'); return; }
  const instr = $('extraNote').value.trim() || '请整体润色：优化结构、语言与排版，保持原文信息不变。';
  const prev = content;
  editor.value = '';
  showStreaming(true, '正在整体润色…');
  setView('edit');
  await streamChat(state.mode, [{
    role: 'user',
    content: '请对以下"当前全文"进行整体修订。\n要求：' + instr + '\n请依据本技能的写作规范，输出修订后的完整全文。\n\n【当前全文】\n' + prev
  }], (full) => { editor.value = full; refreshPreview(); });
  toast('润色完成', 'ok');
}

/* ================= 选中文字修改（重写，避免失焦） ================= */
function captureSelection() {
  const s = editor.selectionStart, e = editor.selectionEnd;
  if (s === e) return;
  state.selStart = s; state.selEnd = e;
  reviseBar.classList.remove('hidden');
  updateReviseHint();
}function updateReviseHint() {
  const sel = editor.value.slice(state.selStart, state.selEnd);
  const tag = reviseBar.querySelector('.rb-tag');
  if (tag) tag.textContent = '✎ 已选中 ' + sel.length + ' 字';
}
function hideRevise() {
  reviseBar.classList.add('hidden');
  state.selStart = 0; state.selEnd = 0;
}
async function applySelectionRevise(ctx) {
  const sel = editor.value.slice(state.selStart, state.selEnd);
  if (!sel.trim()) { hideRevise(); toast('未选中有效文字', 'error'); return; }
  const instr = reviseInput.value.trim();
  if (!instr) { toast('请填写对该段的修改意见', 'error'); return; }
  showStreaming(true, '正在修改选中片段…');
  const before = editor.value.slice(0, state.selStart);
  const after = editor.value.slice(state.selEnd);
  // 记住开始修改前的视口位置：流式改写正文时保持视口不动，避免滚动到底端
  const anchor = editor.scrollTop;
  const fullDoc = before + '<<<SEL_START>>>' + sel + '<<<SEL_END>>>' + after;
  await streamChat(state.mode, [{
    role: 'user',
    content: '以下是一篇按本技能写作规范的文稿，其中用 <<<SEL_START>>> 与 <<<SEL_END>>> 标记了一段文字。\n请依据本技能规范仅针对标记片段进行修改，修改意见：' + instr + '\n只输出修改后的片段本身，不要输出任何解释或其它文字。\n\n【全文（含标记）】\n' + fullDoc
  }], (full) => {
    const clean = full.replace(/<<<SEL_(START|END)>>>/g, '').trim();
    editor.value = before + clean + after;
    editor.scrollTop = anchor; // 保持视口位置
    refreshPreview();
    updateContextButtons();
  });
  // 结束：把光标放回被修改片段的起点，但不允许浏览器自动滚到最下端
  editor.focus({ preventScroll: true });
  const rStart = before.length;
  const rEnd = editor.value.length - after.length;
  try { editor.setSelectionRange(rStart, rEnd); } catch (e) {}
  editor.scrollTop = anchor; // 还原视口，避免 setSelectionRange 触发滚动跳转
  hideRevise();
  toast('选中片段已修改', 'ok');
}

/* ================= 配图提示词 ================= */
function updatePicButton() {
  const can = (state.mode === 'qq' || state.mode === 'wechat') && editor.value.trim().length > 0;
  $('btnPic').classList.toggle('hidden', !can);
}
function openPicModal() {
  if (state.running) { toast('正在处理中，请稍候…'); return; }
  if (!(state.mode === 'qq' || state.mode === 'wechat')) return;
  if (!editor.value.trim()) { toast('先生成或粘贴推送文案', 'error'); return; }
  ['picRatio', 'picCount', 'picStyle', 'picUse', 'picText', 'picColor'].forEach((id) => { $(id).value = ''; });
  $('picTheme').value = '';
  $('picModal').classList.remove('hidden');
}
function closePicModal() { $('picModal').classList.add('hidden'); }
function readPicParams() {
  return {
    ratio: $('picRatio').value.trim(),
    count: $('picCount').value.trim(),
    style: $('picStyle').value.trim(),
    use: $('picUse').value.trim(),
    text: $('picText').value.trim(),
    color: $('picColor').value.trim(),
    theme: $('picTheme').value.trim()
  };
}
async function doPicWithParams(ctx) {
  const pushText = editor.value.trim();
  if (!pushText) { ctx.restore('先生成或粘贴推送文案'); return; }
  closePicModal();
  const p = readPicParams();
  const prefix = editor.value + '\n\n---\n\n';
  showStreaming(true, '正在生成配图提示词…');
  const platform = MODES[state.mode].label === 'QQ 空间推送' ? 'QQ 空间（默认 9:16 竖版）' : '微信公众号（默认 1.91:1 或 16:9 横版）';
  const L = [];
  L.push('以下是一篇已完成的新媒体推送文案，请结合该推送与活动内容，为它生成配图图片提示词。');
  L.push('目标平台/部门：' + (p.use || platform.split('（')[0]));
  L.push('图片比例：' + (p.ratio || '（未指定，按平台与用途采用推荐默认）'));
  L.push('图片数量：' + (p.count || '主图 1 张 + 3 张辅助配图（默认）'));
  L.push('图片风格：' + (p.style || '（未指定，按部门风格推荐）'));
  L.push('色彩倾向：' + (p.color || '（未指定，按部门风格配色）'));
  L.push('主图是否含主题文字：' + (p.text || '主图含活动主题大字（默认）') + (p.theme ? '；主题文字为「' + p.theme + '」' : ''));
  L.push('\n请按技能输出分组配图提示词（1 张承载活动主题的固定主图 + 若干反映活动情况的辅助配图），每条注明图序、画面描述、风格、比例与需生成的文字；参数仍缺失处用合理默认补全，并在末尾单行标注哪些为默认补充。');
  L.push('\n\n【已完成推送文案】\n' + pushText);
  await streamChat('pic', [{ role: 'user', content: L.join('\n') }], (full) => {
    editor.value = prefix + full; refreshPreview();
  });
  toast('配图提示词已生成', 'ok');
}

/* ================= 待确认清单 ================= */
// 清洗单条待确认内容（去掉 md 标记/列表/编号/表头包装）
function cleanChk(s) {
  let x = String(s || '').trim();
  x = x.replace(/^#{1,6}\s*/, '').replace(/^\*\*|\*\*$/g, '');
  x = x.replace(/^\s*[-*•]\s+/, '').replace(/^\s*\d+[.、)）]\s+/, '');
  x = x.replace(/^\|/, '').replace(/\|$/, '');
  x = x.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  return x.replace(/\s+/g, ' ').trim();
}
// 从文稿末尾的"待确认清单"中逐条识别（支持无序列表，亦兼容旧版表格）
function extractChecklist(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const c = lines[i].replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim();
    if (/待确认清单/.test(c) || (/待确认/.test(c) && c.length <= 12)) { start = i; break; }
  }
  if (start < 0) return [];
  const items = [];
  const push = (raw) => { const s = cleanChk(raw); if (s && !items.includes(s)) items.push(s); };
  for (let i = start + 1; i < lines.length; i++) {
    const body = lines[i].replace(/^#{1,6}\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
    if (!body) continue;
    if (/待确认清单|待确认|待核对|请核对/.test(body) && /^#{1,6}\s|^[-*•\d]/.test(lines[i].trim())) continue; // 标题/引导行
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(body)) break;
    if (/^#{1,6}\s/.test(lines[i].trim())) break; // 后续出现新标题则结束
    const bullet = body.match(/^([-*•])\s+(.+)$/);
    const num = body.match(/^(\d+)[.、)）]\s+(.+)$/);
    if (bullet || num) { push((bullet ? bullet[2] : num[2])); continue; }
    if (body.startsWith('|')) {
      const cells = body.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()).filter(Boolean);
      if (!cells.length || cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      if (cells.length >= 2 && cells.every((c) => /^(序号|项|待确认|待核对|需人工核对|名称|内容|说明|备注|金额|占位)/.test(c.replace(/[：:]/g, '')))) continue; // 表头
      push(cells[cells.length - 1] || cells[0]);
      continue;
    }
    // 说明/过渡行跳过
    if (/^(以下|如下|至少|需人工|待核对|请逐项|请核对|注[:：]?|说明[:：]?|示例|例如|包括)/.test(body)) continue;
    push(body);
  }
  return [...new Set(items)];
}
function hasChecklist() {
  return state.mode === 'plan' && /待确认清单|待确认|请核对/.test(editor.value) && extractChecklist(editor.value).length > 0;
}
function updateCheckButton() {
  $('btnCheck').classList.toggle('hidden', !hasChecklist());
}
function openCheckModal() {
  const items = extractChecklist(editor.value);
  if (!items.length) { toast('未识别到"待确认清单"，请先生成策划案初稿', 'error'); return; }
  const box = $('checkItems');
  box.innerHTML = '';
  items.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'check-item';
    const q = document.createElement('div');
    q.className = 'q';
    q.textContent = (idx + 1) + '. ' + it;
    const a = document.createElement('div');
    a.className = 'a';
    const ta = document.createElement('textarea');
    ta.rows = 1;
    ta.placeholder = '填写确认后的信息（留空则该项仍保留为待确认）';
    ta.dataset.q = it;
    ta.addEventListener('input', () => ta.classList.toggle('is-filled', !!ta.value.trim()));
    a.appendChild(ta);
    row.appendChild(q); row.appendChild(a);
    box.appendChild(row);
  });
  $('checkNotice').textContent = '共识别到 ' + items.length + ' 项待确认内容。';
  $('checkModal').classList.remove('hidden');
}
async function submitChecklist(ctx) {
  const original = editor.value;
  const fills = [];
  document.querySelectorAll('#checkItems .check-item').forEach((row) => {
    const qEl = row.querySelector('.q');
    const ta = row.querySelector('textarea');
    const val = ta.value.trim();
    const q = (qEl.textContent || '').replace(/^\d+\.\s*/, '');
    if (val) fills.push({ q, val });
    else fills.push({ q, val: '' });
  });
  const answered = fills.filter((f) => f.val).length;
  if (!answered) {
    toast('请至少填写一项待确认信息', 'error');
    return;
  }
  // 生成定稿前的原稿存档提示
  $('checkModal').classList.add('hidden');
  showStreaming(true, '正在回填并生成定稿…');
  setView('edit');
  editor.value = '';
  const body = fills.map((f, i) => {
    const label = String(i + 1) + '. ' + f.q;
    return f.val ? `【已确认】${label} → ${f.val}` : `【未确认】${label}`;
  }).join('\n');
  const prompt = '以下是某次生成的一份策划案初稿（含待确认清单）。现在用户就清单中的部分项提供了确认信息。请按本技能公文规范，把这些确认信息回填到正文对应位置（替换相应占位符、金额、日期、人员、教室编号等），对仍未确认的项继续保留占位符并保留在"待确认清单"中。输出回填后的完整定稿。\n\n【用户确认信息】\n' + body + '\n\n【初稿全文】\n' + original;
  await streamChat('plan', [{ role: 'user', content: prompt }], (full) => {
    editor.value = full; refreshPreview();
  });
  toast('定稿已生成（已回填 ' + answered + ' 项）', 'ok');
}

/* ================= 我的存档（localStorage） ================= */
const LIB_KEY = 'nau_writer_lib';
function loadLib() { try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch (e) { return []; } }
function saveLib(arr) { localStorage.setItem(LIB_KEY, JSON.stringify(arr)); }
function libId() { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function openSaveModal(editIfExists) {
  if (!editor.value.trim()) { toast('当前正文为空，无可保存内容', 'error'); return; }
  if (editIfExists) {
    $('saveTitle').value = editIfExists.title || '';
    $('saveMemo').value = editIfExists.memo || '';
    state.editingLibId = editIfExists.id;
  } else {
    const d = new Date();
    const stamp = `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    $('saveTitle').value = MODES[state.mode].label + ' · ' + stamp;
    $('saveMemo').value = '';
    state.editingLibId = null;
  }
  $('saveModal').classList.remove('hidden');
  $('saveTitle').focus();
  $('saveTitle').select();
}
/* 收集左侧“活动/需求信息”配置，随存档一起保存 */
function collectConfig() {
  const r = readFields();
  return {
    mode: state.mode,
    values: r.obj,
    note: r.note,
    import: importedPlanText()
  };
}
/* 载入存档时，把保存的左侧配置回填（模式 + 各字段 + 补充说明 + 导入策划案） */
function applyConfigToUI(cfg) {
  if (!cfg || !cfg.mode || !MODES[cfg.mode]) return false;
  switchMode(cfg.mode);
  const vals = cfg.values || {};
  const typeEl = document.querySelector('#modeFields select[data-k="type"]');
  if (state.mode === 'time' && typeEl && vals.type) typeEl.value = vals.type;
  Object.keys(vals).forEach((k) => {
    const el = document.querySelector('#modeFields [data-k="' + k + '"]');
    if (el) el.value = (vals[k] == null ? '' : vals[k]);
  });
  if (state.mode === 'time') applyTimeFilter();
  $('extraNote').value = (cfg.note == null ? '' : cfg.note);
  if (cfg.import) {
    $('importText').value = cfg.import;
    $('importBox').classList.remove('hidden');
  } else {
    $('importText').value = '';
    $('importBox').classList.add('hidden');
  }
  return true;
}
function loadFromLib(it) {
  const cfg = it.config && it.config.mode && MODES[it.config.mode] ? it.config : null;
  if (cfg) { applyConfigToUI(cfg); }
  else if (MODES[it.mode]) { switchMode(it.mode); }
  else { switchMode('plan'); }
  editor.value = it.text || '';
  refreshPreview();
  updateContextButtons();
  toast('已载入：' + it.title, 'ok');
}
function saveCurrentFromModal() {
  const title = $('saveTitle').value.trim();
  if (!title) { toast('请填写存档标题', 'error'); return; }
  const memo = $('saveMemo').value.trim();
  const config = collectConfig();
  const arr = loadLib();
  if (state.editingLibId) {
    const it = arr.find((x) => x.id === state.editingLibId);
    if (it) { it.title = title; it.memo = memo; it.text = editor.value; it.mode = state.mode; it.config = config; it.updated = Date.now(); }
  } else {
    arr.unshift({
      id: libId(), title, memo, mode: state.mode, config,
      text: editor.value,
      created: Date.now(), updated: Date.now()
    });
  }
  saveLib(arr.slice(0, 60));
  renderLib();
  $('saveModal').classList.add('hidden');
  toast('已保存到我的存档（含左侧配置）', 'ok');
}
function renderLib() {
  const arr = loadLib();
  $('libEmpty').classList.toggle('hidden', arr.length > 0);
  const ul = $('libList');
  ul.innerHTML = '';
  arr.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'lib-item';

    const head = document.createElement('div');
    head.className = 'lib-item-head';
    const dot = document.createElement('span'); dot.className = 'hd';
    const name = document.createElement('span'); name.className = 'lib-name'; name.textContent = it.title || '（未命名）';
    head.append(dot, name);
    li.appendChild(head);

    // 备注
    if (it.memo) {
      const memo = document.createElement('div');
      memo.className = 'lib-memo';
      memo.textContent = it.memo;
      li.appendChild(memo);
    }

    // 类型 + 时间
    const dt = new Date(it.updated || it.created);
    const timeStr = `${dt.getMonth() + 1}-${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    const tag = document.createElement('div');
    tag.className = 'lib-tag';
    tag.textContent = (MODES[it.mode] ? MODES[it.mode].label : '') + ' · ' + timeStr;
    li.appendChild(tag);

    // 按钮
    const btns = document.createElement('div');
    btns.className = 'lib-btns';
    btns.appendChild(mkBtn('载入', () => loadFromLib(it), 'primary'));
    btns.appendChild(mkBtn('导出', () => download(safeName(it.title) + '.md', it.text)));
    btns.appendChild(mkBtn('改名', () => openSaveModal(it)));
    btns.appendChild(mkBtn('删除', () => {
      if (confirm('确定删除存档「' + it.title + '」？')) {
        saveLib(loadLib().filter((x) => x.id !== it.id));
        renderLib();
        toast('已删除', 'ok');
      }
    }, 'danger'));
    li.appendChild(btns);
    ul.appendChild(li);
  });
}

/* ================= 从存档加载策划 ================= */
function openPlanModal() {
  const arr = loadLib().filter((it) => (it.mode === 'plan') || (it.config && it.config.mode === 'plan'));
  const list = $('planList');
  list.innerHTML = '';
  $('planEmpty').classList.toggle('hidden', arr.length > 0);
  arr.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'plan-item';
    const name = document.createElement('div');
    name.className = 'plan-name';
    name.textContent = it.title || '（未命名）';
    const d = new Date(it.updated || it.created);
    const meta = document.createElement('div');
    meta.className = 'plan-meta';
    meta.textContent = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} · 正文 ${it.text ? it.text.length : 0} 字`;
    li.append(name, meta);
    li.onclick = () => loadPlanFromArchive(it);
    list.appendChild(li);
  });
  $('planModal').classList.remove('hidden');
}
function loadPlanFromArchive(it) {
  $('planModal').classList.add('hidden');
  $('importText').value = it.text || '';
  $('importBox').classList.remove('hidden');
  updateContextButtons();
  toast('已载入策划：' + (it.title || '存档'), 'ok');
}
function mkBtn(label, fn, kind) {
  const b = document.createElement('button');
  b.className = 'btn' + (kind ? ' ' + kind : '');
  b.textContent = label;
  b.onclick = (e) => { e.stopPropagation(); fn(); };
  return b;
}
function safeName(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, '_').trim() || '存档';
}

/* ================= UI 状态 ================= */
function setView(v) {
  state.view = v;
  editPane.classList.toggle('hidden', v !== 'edit');
  previewPane.classList.toggle('hidden', v !== 'preview');
  const pp = $('plainPane');
  if (pp) pp.classList.toggle('hidden', v !== 'plain');
  document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
}
function showStreaming(on, txt) {
  const el = $('streamingTip');
  el.innerHTML = (txt || '正在生成…') + ' <span id="streamingSpinner"></span>';
  el.classList.toggle('hidden', !on);
}
function setRunningUI(on) {
  ['btnGenerate', 'btnReviseAll', 'btnCheck', 'btnPic'].forEach((id) => { $(id).disabled = on; });
}
function updateContextButtons() {
  updatePicButton();
  updateCheckButton();
  // 在「策划案」模式下不再需要加载/导入策划；QQ/微信/学时可加载策划作为生成依据
  const isContext = state.mode !== 'plan';
  const a = $('btnLoadPlanArchive'); if (a) a.classList.toggle('hidden', !isContext);
  const w = $('btnImportWord'); if (w) w.classList.toggle('hidden', !isContext);
}

/* ================= 导出 ================= */
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
function defaultFilename(ext) {
  const d = new Date();
  const stamp = `${d.getMonth() + 1}-${d.getDate()}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  return `智农团委-${MODES[state.mode].label}-${stamp}.${ext}`;
}

/* ================= 模型设置 ================= */
let pubCfg = null;
async function loadCfg() {
  try {
    const res = await api('/api/config');
    pubCfg = await res.json();
    renderCfg();
    const st = $('connStatus');
    st.textContent = '● 服务已连接';
    st.className = 'chip ok';
    const active = pubCfg.providers[pubCfg.active];
    const mc = $('chipModel');
    if (active) {
      mc.textContent = (pubCfg.active === 'zhipu' ? '智谱' : 'DeepSeek') + ' · ' + active.model;
      mc.classList.remove('hidden');
    }
  } catch (e) {
    const st = $('connStatus');
    st.textContent = '● 服务未连接';
    st.className = 'chip bad';
  }
}
async function api(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    let msg = '请求失败 (' + res.status + ')';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (e) {}
    throw new Error(msg);
  }
  return res;
}
function renderCfg() {
  if (!pubCfg) return;
  const sel = $('cfgActive');
  sel.innerHTML = '';
  Object.keys(pubCfg.providers).forEach((k) => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = pubCfg.providers[k].label + (k === pubCfg.active ? '（当前）' : '');
    sel.appendChild(o);
  });
  sel.value = pubCfg.active;
  const cont = $('providersContainer');
  cont.innerHTML = '';
  Object.keys(pubCfg.providers).forEach((k) => {
    const p = pubCfg.providers[k];
    const blk = document.createElement('div');
    blk.className = 'prov-block';
    const h4 = document.createElement('h4');
    h4.innerHTML = escapeHtml(p.label) +
      `<span class="status ${p.hasKey ? 'on' : 'off'}">${p.hasKey ? '● 已配置' : '○ 未填 Key'}</span>`;
    const grid = document.createElement('div');
    grid.className = 'grid2';
    grid.innerHTML = `
      <div class="field"><label>API Key</label>
        <input data-k="${k}" data-type="key" type="password" autocomplete="off"
          placeholder="${p.hasKey ? '已保存，留空保持不变' : '请输入 API Key'}"></div>
      <div class="field"><label>模型</label>
        <input data-k="${k}" data-type="model" type="text" value="${escapeHtml(p.model)}"></div>
      <div class="field full"><label>Base URL</label>
        <input data-k="${k}" data-type="base" type="text" value="${escapeHtml(p.baseUrl)}"></div>`;
    blk.appendChild(h4);
    blk.appendChild(grid);
    cont.appendChild(blk);
  });
}
async function saveCfg() {
  const providers = {};
  Object.keys(pubCfg.providers).forEach((k) => {
    providers[k] = {};
    const keyEl = document.querySelector(`input[data-k="${k}"][data-type="key"]`);
    const modelEl = document.querySelector(`input[data-k="${k}"][data-type="model"]`);
    const baseEl = document.querySelector(`input[data-k="${k}"][data-type="base"]`);
    if (keyEl && keyEl.value.trim()) providers[k].apiKey = keyEl.value.trim();
    if (modelEl && modelEl.value.trim()) providers[k].model = modelEl.value.trim();
    if (baseEl && baseEl.value.trim()) providers[k].baseUrl = baseEl.value.trim();
  });
  const res = await api('/api/config', { method: 'POST', body: JSON.stringify({ active: $('cfgActive').value, providers }) });
  pubCfg = await res.json();
  renderCfg();
  updateModelChip();
  toast('配置已保存', 'ok');
}
async function testCfg() {
  const active = $('cfgActive').value;
  // Key 已保存时输入框为空 = 保持原 Key，直接测试；若确实无 Key 则提示填写
  const prov = pubCfg && pubCfg.providers[active];
  const keyEl = document.querySelector(`input[data-k="${active}"][data-type="key"]`);
  const typedKey = keyEl && keyEl.value.trim();
  if (!typedKey && !(prov && prov.hasKey)) {
    toast('请先填写该提供商的 API Key 再测试', 'error');
    return;
  }
  toast('正在测试连接…');
  $('btnTestCfg').disabled = true;
  $('btnTestCfg').textContent = '测试中…';
  try {
    await saveCfg(); // 把表单(含新 Key/模型)先保存，服务端才能用其测试
    const res = await api('/api/test', { method: 'POST', body: JSON.stringify({ provider: active }) });
    const data = await res.json();
    if (data.ok) toast('连接成功 ✔ 模型回复：' + (data.reply || ''), 'ok');
    else toast('连接失败：' + (data.error || '未知错误'), 'error');
  } catch (e) {
    toast('连接失败：' + e.message, 'error');
  } finally {
    $('btnTestCfg').disabled = false;
    $('btnTestCfg').textContent = '测试连接';
  }
}
function updateModelChip() {
  const active = pubCfg && pubCfg.providers[pubCfg.active];
  const mc = $('chipModel');
  if (active) { mc.textContent = (pubCfg.active === 'zhipu' ? '智谱' : 'DeepSeek') + ' · ' + active.model; mc.classList.remove('hidden'); }
  else mc.classList.add('hidden');
}

/* ================= 事件绑定 ================= */
// 生成 / 润色 / 配图 / 定稿：统一走 guardRun 管理 running 状态
$('btnGenerate').onclick = guardRun(runGenerate);
$('btnReviseAll').onclick = guardRun(runReviseAll);
$('btnPic').onclick = openPicModal;
$('btnPicGo').onclick = guardRun(doPicWithParams);
$('btnPicCancel').onclick = closePicModal;
$('btnCheck').onclick = openCheckModal;
$('btnCheckOk').onclick = guardRun(submitChecklist);
$('btnCheckCancel').onclick = () => $('checkModal').classList.add('hidden');

$('btnClear').onclick = () => { editor.value = ''; refreshPreview(); updateContextButtons(); toast('已清空'); };
function getCurrentText() {
  // 编辑视图返回 Markdown 源，纯文本/预览时返回纯文本或 Markdown
  return state.view === 'plain' ? markdownToPlain(editor.value) : editor.value;
}
async function copyText(t) {
  if (!t) { toast('内容为空'); return false; }
  try { await navigator.clipboard.writeText(t); toast('已复制到剪贴板', 'ok'); return true; }
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      toast('已复制', 'ok'); return true;
    } catch (e2) { toast('复制失败', 'error'); return false; }
  }
}
$('btnCopy').onclick = () => { if (!editor.value) { toast('内容为空'); return; } copyText(editor.value); };
$('btnCopyPlain').onclick = () => {
  const p = markdownToPlain(editor.value);
  if (!p) { toast('内容为空'); return; }
  copyText(p);
};
$('btnExportMd').onclick = () => { if (editor.value) download(defaultFilename('md'), editor.value); else toast('内容为空'); };
$('btnExportTxt').onclick = () => {
  const p = markdownToPlain(editor.value);
  if (p) download(defaultFilename('txt'), p); else toast('内容为空');
};
$('btnExportDocx').onclick = exportDocx;

// Word(.docx) 导出：调用后端
async function exportDocx() {
  const md = editor.value.trim();
  if (!md) { toast('内容为空'); return; }
  const base = MODES[state.mode].label;
  const d = new Date();
  const stamp = `${d.getMonth() + 1}-${d.getDate()}`;
  const fname = `智农团委-${base}-${stamp}.docx`;
  try {
    const res = await fetch('/api/export-docx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: md })
    });
    if (!res.ok) {
      let msg = '导出失败 (' + res.status + ')';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch (e) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
    toast('已导出 Word 文档', 'ok');
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 导入 Word(.docx) 读取策划案 / 从存档加载策划 ---------- */
$('btnImportWord').onclick = () => $('fileWord').click();
$('btnLoadPlanArchive').onclick = openPlanModal;
$('btnPlanCancel').onclick = () => $('planModal').classList.add('hidden');
$('fileWord').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  if (!/\.docx$/i.test(file.name)) { toast('请选择 .docx 格式的 Word 文档', 'error'); return; }
  toast('正在读取 ' + file.name + ' …');
  try {
    const buf = await file.arrayBuffer();
    const res = await fetch('/api/import-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buf
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '导入失败');
    $('importText').value = data.text;
    $('importBox').classList.remove('hidden');
    toast('已导入策划案（' + data.chars + ' 字）', 'ok');
    // 自动提示：切到 QQ/微信 即可据其撰写推送
    if (state.mode === 'qq' || state.mode === 'wechat') {
      updateContextButtons();
    } else {
      toast('已导入策划案。可切到"QQ 空间推送/微信推送"据此撰写推送', 'ok');
    }
  } catch (e) { toast(e.message, 'error'); }
});
$('btnClearImport').onclick = () => { $('importText').value = ''; $('importBox').classList.add('hidden'); }; 

editor.addEventListener('input', () => { refreshPreview(); updateContextButtons(); });
editor.addEventListener('mouseup', captureSelection);
editor.addEventListener('keyup', (e) => {
  if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) captureSelection();
});
editor.addEventListener('blur', () => {
  // 移入修改输入框时不关闭；移出到其它处则关闭
  setTimeout(() => {
    if (reviseBar.classList.contains('hidden')) return;
    if (document.activeElement === reviseInput || reviseBar.contains(document.activeElement)) return;
    hideRevise();
  }, 150);
});
editor.addEventListener('select', captureSelection);
editor.addEventListener('click', () => {
  if (editor.selectionStart === editor.selectionEnd) hideRevise();
});

reviseInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doReviseSel(); }
  if (e.key === 'Escape') hideRevise();
});
reviseInput.addEventListener('mousedown', (e) => e.stopPropagation());

// 选中片段修改：统一经 guardRun 管理运行态
function doReviseSel() {
  const sel = editor.value.slice(state.selStart, state.selEnd);
  if (!sel.trim()) { toast('未选中文字，请先在编辑区选中一段', 'error'); return; }
  const fn = guardRun(async () => {
    await applySelectionRevise();
  });
  fn();
}
$('btnReviseSel').onclick = doReviseSel;
$('btnReviseCancel').onclick = () => { hideRevise(); editor.focus(); };

// 存档
$('btnSaveCurrent').onclick = () => openSaveModal();
$('btnSaveNow').onclick = () => openSaveModal();
$('btnSaveOk').onclick = saveCurrentFromModal;
$('btnSaveCancel').onclick = () => { $('saveModal').classList.add('hidden'); };
$('btnClearLib').onclick = () => { if (confirm('确定清空我的存档？此操作不可恢复。')) { saveLib([]); renderLib(); toast('已清空存档', 'ok'); } };

// 设置
$('btnSettings').onclick = () => { $('settingsModal').classList.remove('hidden'); loadCfg(); };
$('btnCloseCfg').onclick = () => $('settingsModal').classList.add('hidden');
$('btnSaveCfg').onclick = saveCfg;
$('btnTestCfg').onclick = testCfg;
$('settingsModal').addEventListener('click', (e) => { if (e.target === $('settingsModal')) $('settingsModal').classList.add('hidden'); });

// 弹窗按 Esc 关闭 & 点背景关闭
[['saveModal'], ['checkModal'], ['settingsModal'], ['picModal'], ['planModal']].forEach(([id]) => {
  const m = $(id);
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
});

document.querySelectorAll('.seg-btn').forEach((b) => { b.onclick = () => setView(b.dataset.view); });

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('btnGenerate').click(); }
  if (e.key === 'Escape') {
    hideRevise();
    ['saveModal', 'checkModal', 'settingsModal', 'picModal', 'planModal'].forEach((id) => $(id).classList.add('hidden'));
  }
});

/* ================= 主题换肤 ================= */
const THEME_KEY = 'nau_writer_theme';
function applyTheme(v) {
  document.documentElement.setAttribute('data-theme', v || 'red');
}
function initTheme() {
  const el = $('themeSel');
  if (!el) return;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && ['red', 'blue', 'green', 'yellow', 'dark'].includes(saved)) el.value = saved;
  applyTheme(el.value);
  el.addEventListener('change', () => {
    applyTheme(el.value);
    localStorage.setItem(THEME_KEY, el.value);
  });
}

/* ================= 初始化 ================= */
function init() {
  initTheme();
  buildModeTabs();
  buildFields();
  setView('edit');
  renderLib();
  loadCfg();
  updateContextButtons();
  refreshPreview();
}
init();
