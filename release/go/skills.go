package main

import "strings"

// 各功能应加载的技能文件（相对 assets/skills/）
var fileSets = map[string][]string{
	"plan": {
		"plan_skill/SKILL.md",
		"plan_skill/references/knowledge-base.md",
	},
	"qq": {
		"QQ_push_skill_v2/SKILL.md",
		"QQ_push_skill_v2/references/structure_type.md",
		"QQ_push_skill_v2/references/structure.md",
		"QQ_push_skill_v2/references/style.md",
		"QQ_push_skill_v2/references/terms.md",
		"QQ_push_skill_v2/references/departments.md",
		"QQ_push_skill_v2/references/examples.md",
	},
	"pic": {
		"push_pic_skill/SKILL.md",
		"push_pic_skill/references/parameters.md",
		"push_pic_skill/references/prompt-structure.md",
		"push_pic_skill/references/style-guide.md",
	},
	"wechat": {
		"wechat_push_skill/SKILL.md",
	},
	"time": {
		"time_skill/time.md",
	},
}

var rolePreface = map[string]string{
	"plan":   "你是南京农业大学智慧农业学院（人工智能学院）团委组织部的\"策划案自动生成与审核助手\"。下面是官方技能文件全文，你必须严格遵循其中的固定模板结构、公文话术、生成流程与底线规则。",
	"qq":     "你是南京农业大学智慧农业学院（人工智能学院）学生组织新媒体写作助手，专门仿照该院各学生组织风格撰写 QQ 空间推送。下面是官方技能文件全文，请严格遵循其中的工作流、结构选择、风格与术语。",
	"pic":    "你是校园新媒体推送的配图提示词生成助手（image-prompt 技能）。下面是官方技能文件全文，请严格遵循其工作流与提示词模板。",
	"wechat": "你是南京农业大学智慧农业学院（人工智能学院）官方微信公众号写作助手。下面是官方技能文件全文，请严格遵循其中的定位、结构模板、语言风格与自查清单。",
	"time":   "你是南京农业大学智慧农业学院（人工智能学院）团委组织部的\"第二课堂学时申请与认定\"助手。下面是官方技能文件全文，请严格遵循其中附件1申请表、附件2认定表、附件3学时认定名单的格式规范、字段校验规则与时间节点要求。",
}

var allModes = []string{"plan", "qq", "pic", "wechat", "time"}

func isValidMode(mode string) bool {
	for _, m := range allModes {
		if m == mode {
			return true
		}
	}
	return false
}

// buildSystemPrompt 按功能拼装系统提示词（与 Node 版保持一致）
func buildSystemPrompt(mode string) string {
	var sb strings.Builder
	sb.WriteString("# 角色\n")
	sb.WriteString(rolePreface[mode])
	for _, f := range fileSets[mode] {
		content, ok := readAsset("assets/skills/" + f)
		if !ok {
			content = "[无法读取技能文件：" + f + "]"
		}
		sb.WriteString("\n\n<!-- ===== 技能文件：" + f + " ===== -->\n")
		sb.WriteString(content)
	}
	sb.WriteString("\n\n# 总体指令\n请完全依据上述技能文件执行任务，不要偏离其规定的结构与话术。若用户提供的信息不足以确定某项，使用合理默认值补全并在输出末尾用一行标注哪些为默认补充，供用户核对替换。")
	sb.WriteString("\n\n# 排版约束\n输出优先使用段落与列表，**除非本技能明确要求，不要随意使用 Markdown 表格**（例如策划案中仅\"经费预算\"一节可用表格；待确认清单等一律用有序列表）。请在内容里直接给出最终文本，不要输出表格以外的多余 Markdown 噪音。")
	if mode == "qq" {
		sb.WriteString("\n\n# 列表约束\nQQ 空间推送正文**不要使用任何列表符号**（不要出现 Markdown 无序\"-\"\"•\"\"*\"，也不要使用 \"1. 2. \" 有序编号），需要并列罗列的信息一律用**换行分段**表达。")
	} else {
		sb.WriteString("\n\n# 列表约束\n正文如需分点，一律使用**有序数字列表**（格式 \"1. …\" \"2. …\"），**不要使用\"-\"\"•\"等无序列表符号**。")
	}
	return sb.String()
}
