const fs = require('fs');
const path = require('path');

// 技能根目录：本项目位于 ai_writer/ai-writer-app，技能仓库在 ai_writer 下
const SKILL_ROOT = path.join(__dirname, '..', '..');

function read(file) {
  const full = path.join(SKILL_ROOT, file);
  try {
    return fs.readFileSync(full, 'utf8');
  } catch (e) {
    return `[无法读取技能文件：${file}]`;
  }
}

// 各功能应加载的技能 md 清单（严格对应四个 skill 目录）
const FILE_SETS = {
  plan: [
    'plan_skill/SKILL.md',
    'plan_skill/references/knowledge-base.md'
  ],
  qq: [
    'QQ_push_skill_v2/SKILL.md',
    'QQ_push_skill_v2/references/structure_type.md',
    'QQ_push_skill_v2/references/structure.md',
    'QQ_push_skill_v2/references/style.md',
    'QQ_push_skill_v2/references/terms.md',
    'QQ_push_skill_v2/references/departments.md',
    'QQ_push_skill_v2/references/examples.md'
  ],
  pic: [
    'push_pic_skill/SKILL.md',
    'push_pic_skill/references/parameters.md',
    'push_pic_skill/references/prompt-structure.md',
    'push_pic_skill/references/style-guide.md'
  ],
  wechat: [
    'wechat_push_skill/SKILL.md'
  ]
};

function rolePreface(mode) {
  const map = {
    plan: '你是南京农业大学智慧农业学院（人工智能学院）团委组织部的"策划案自动生成与审核助手"。下面是官方技能文件全文，你必须严格遵循其中的固定模板结构、公文话术、生成流程与底线规则。',
    qq: '你是南京农业大学智慧农业学院（人工智能学院）学生组织新媒体写作助手，专门仿照该院各学生组织风格撰写 QQ 空间推送。下面是官方技能文件全文，请严格遵循其中的工作流、结构选择、风格与术语。',
    pic: '你是校园新媒体推送的配图提示词生成助手（image-prompt 技能）。下面是官方技能文件全文，请严格遵循其工作流与提示词模板。',
    wechat: '你是南京农业大学智慧农业学院（人工智能学院）官方微信公众号写作助手。下面是官方技能文件全文，请严格遵循其中的定位、结构模板、语言风格与自查清单。'
  };
  return map[mode] || '';
}

function buildSystemPrompt(mode) {
  const files = FILE_SETS[mode];
  const parts = [];
  parts.push('# 角色\n' + rolePreface(mode));
  for (const f of files) {
    parts.push('\n\n<!-- ===== 技能文件：' + f + ' ===== -->\n' + read(f));
  }
  parts.push('\n\n# 总体指令\n请完全依据上述技能文件执行任务，不要偏离其规定的结构与话术。若用户提供的信息不足以确定某项，使用合理默认值补全并在输出末尾用一行标注哪些为默认补充，供用户核对替换。');
  return parts.join('\n');
}

const ALL_MODES = Object.keys(FILE_SETS);
module.exports = { buildSystemPrompt, ALL_MODES };
