# 智农AI组织部 · AI Organization Department

面向 **南京农业大学智慧农业学院（人工智能学院）团委** 的一体化写作前端/后端工程。它把四个既有 skill（`plan_skill` 策划案、`QQ_push_skill_v2` QQ 空间推送、`push_pic_skill` 配图提示词、`wechat_push_skill` 微信公众号推送）的提示词工程固化为后端系统提示词，通过大模型 API 完成文案撰写，并提供网页编辑器供二次修改、选中文字定向修改与文本导出。

## 功能

- **策划案撰写**：严格套用学院组织部固定模板结构，结尾附"待确认清单"。
- **QQ 空间推送撰写**：按部门/推送类型风格撰写。
- **微信推送撰写**：贴合官方公众号（CollegeSA&AI NAU）调性。
- **配图提示词**：为已完成的推送文案一键生成主图 + 辅助配图提示词。
- 右侧 Markdown 编辑器：可在线编辑、切换预览。
- **选中文字定向修改**：在编辑区选中一段文字，会弹出修改条，输入针对该段的修改意见即可让模型只改写该片段（不会因点击输入框而失焦）。
- **待确认清单回填**：策划案生成后，点"填写待确认清单并出定稿"，逐项填写草稿中需你确认的信息，模型会回填占位符并输出定稿。
- **导入 Word 策划案 → 写推送**：点"📄 导入Word"选择 `.docx` 策划案，系统提取其全文；随后切到 QQ / 微信推送模式，生成的推送会以该策划案为事实依据撰写。
- **我的存档**：左侧可把任一写作成果命名保存到浏览器本地（localStorage），随时载入、改名、导出或删除。
- **输出视图**：编辑 / 预览 / **纯文本** 三种视图。纯文本去除了所有 Markdown 符号，可直接复制进 QQ / 公众号编辑器。
- **导出**：`.md`、纯文本 `.txt`、**Word `.docx`**。
- 一键生成 / 整体润色 / 复制 / 复制纯文本。

## 技术栈

- 后端：Node.js + Express（原生 `fetch` 流式转发，无多余框架）。
- 前端：原生 HTML / CSS / JS 单页（红色主题，无构建步骤）。
- 大模型：支持 OpenAI 兼容协议的两个提供商。
  - **智谱 GLM-4.7-Flash（免费）** —— 默认，模型名 `glm-4.7-flash`，仅需填入智谱开放平台 API Key。
  - **DeepSeek deepseek-v4-flash** —— 模型名 `deepseek-v4-flash`，需填入 DeepSeek 开放平台 API Key。

## 目录结构

```
ai-writer-app/
├─ package.json
├─ server/
│  ├─ index.js      # Express 服务 + 静态托管 + API
│  ├─ config.js     # 模型配置读写（存于 data/config.json）
│  ├─ skills.js     # 按功能加载 4 个 skill 的 md 文件拼装系统提示词
│  └─ llm.js        # 统一流式调用 GLM / DeepSeek
├─ public/          # 前端（index.html / style.css / app.js）
└─ data/            # 运行期生成 config.json（apiKey 本地保存）
```

> 技能文件直接引用工程外层的 skill 仓库（`../plan_skill` 等），不在此目录内复制，保证提示词与给定 skill 始终同步。

## 启动

前置：Node.js ≥ 18。

```bash
cd ai-writer-app
npm install
npm start
```

打开浏览器访问：http://127.0.0.1:5503

## 使用步骤

1. 首次使用点右上角 **⚙ 模型设置**，选择提供商（智谱 GLM-4.7-Flash / DeepSeek deepseek-v4-flash），填入对应 API Key 并保存。Key 仅保存在本机 `data/config.json`。可用"测试连接"按钮验证 Key 与网络是否正常。
2. 左侧顶部切换要写的类型：**策划案 / QQ 空间推送 / 微信推送**。
3. 填写活动 / 需求信息（可按需只填部分，缺失项由模型用默认值补全并标注），补充说明可选。
4. 点 **✦ 生成全文** → 流式输出到右侧编辑区。
   - QQ 或微信生成后，点 **🖼 为当前文案生成配图提示词**。
   - 想对整篇润色：点 **整体润色 / 修改**。
5. 在右侧选中一段文字 → 底部弹出"✎ 已选中"修改条 → 在输入框填针对该段的修改意见 → **应用**（仅改写选中片段）。
6. **策划案定稿**：若草稿含"待确认清单"，左侧会出现 **📋 填写待确认清单并出定稿**，逐项填写后生成回填占位符的定稿。
7. **由 Word 策划案写推送**：点 **📄 导入Word** 选择 `.docx` 策划案 → 提取全文显示；切到 QQ / 微信模式点生成，推送将据策划案撰写。
8. **保存成果**：点编辑区右上或左侧的 **💾 保存当前**，输入标题保存到"我的存档"；存档可随时载入 / 改名 / 导出 / 删除，数据存于浏览器 localStorage。
9. **输出**：右侧顶部可切 **编辑 / 预览 / 纯文本**；纯文本视图适合直接复制到 QQ / 公众号编辑器。导出按钮支持 `.md`、`.txt`（纯文本）、**Word `.docx`**。

## API 一览

- `GET  /api/config` 读取当前模型配置（不含 key）。
- `POST /api/config` 保存提供商与 API Key。
- `GET  /api/modes` 返回各功能系统提示词规模（自检用）。
- `POST /api/test` 轻量连接测试。Body：`{ provider }`。
- `POST /api/chat` 流式生成。Body：`{ mode, messages, provider? , temperature? }`，`mode ∈ {plan, qq, pic, wechat}`。返回 `text/plain` 增量文本流。
- `POST /api/import-docx` 导入 Word。Body 为 `.docx` 原始字节，返回 `{ text, chars }`。
- `POST /api/export-docx` 导出 Word。Body：`{ text }`，返回 `.docx` 文件。

## 说明

- 各功能的系统提示词分别由下列 skill 文件拼装：
  - 策划案 → `plan_skill/SKILL.md` + `references/knowledge-base.md`
  - QQ 推送 → `QQ_push_skill_v2/SKILL.md` + 其全部 `references/*.md`
  - 配图提示词 → `push_pic_skill/SKILL.md` + 其全部 `references/*.md`
  - 微信推送 → `wechat_push_skill/SKILL.md`
- 大语料参考库（如 `messages.json`、`extracted_texts.json`）体积过大，未整体注入，仅在技能文件指引下由模型按规范创作。如确需注入参考语料，可在此工程中按需对指定数据抽样后附加到 `server/skills.js` 的对应清单。
