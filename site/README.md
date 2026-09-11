# site/ —— 项目介绍 / 下载页

纯前端原生单页（**零依赖、零构建、无外部请求**）：`index.html` + `logo.png` + 可选的本地 exe / skill zip，
双击即可打开，也能丢到任意静态托管。

## 一、本地查看

- 直接双击 `site/index.html`（`file://` 打开即可，样式、主题、交互都正常）
- 或用任意静态服务器（**推荐**，这样本地 exe 探测才生效）：
  ```powershell
  cd site
  python -m http.server 8085      # 访问 http://127.0.0.1:8085
  ```

## 二、下载按钮的行为

页面有两个下载目标，互不影响：

| 按钮（出现位置） | class | 文件 | 默认直链 |
|---|---|---|---|
| 下载（顶栏）· 下载 Windows 版（Hero）· 下载 AIOD-Writer-Go-v1.2.exe（下载区） | `js-dl` | `AIOD-Writer-Go-v1.2.exe` | `https://github.com/tengkongJS-MC/AI_SA-AI_OD-NAU/releases/download/v1.2.0/AIOD-Writer-Go-v1.2.exe` |
| 仅下载 Skill 包（Hero · 下载区） | `js-dl-skill` | `AIOD-Skills-v1.2.zip` | `https://github.com/tengkongJS-MC/AI_SA-AI_OD-NAU/releases/download/v1.2.0/AIOD-Skills-v1.2.zip` |

两者都在页面加载时探测**同目录**是否已有同名文件：存在就改指本地文件，并把 Hero 的「下载源」字样显示为
「本地文件（同目录）」（应用与 Skill 包各有一处字样）；否则保持 Release 直链。
（`file://` 下无法探测，会自动用直链。下载区里那行「Release 直链」链接由 `ASSETS[*].link` 指向的元素同步 href。）

> 现状：`AIOD-Skills-v1.2.zip` 已**发布为 Release 附件**并放在仓库 `skill_release/`（不在 `site/` 里），
> 所以页面默认走直链；把 zip 复制到 `site/` 同目录，就自动切回「本地文件」——适合做离线分发包。
> exe 8.4 MB，通常只放 Release 里。

### Skill 包（zip）怎么来的

zip 由仓库根目录的 5 个 skill 目录打包生成，使用教程一并打进包内；产物与教程都在 **`skill_release/`**：

```powershell
cd skill_release
powershell -ExecutionPolicy Bypass -File .\build-skill-pack.ps1    # 生成 AIOD-Skills-v1.2.zip
```

- 收进去的是各 skill 的 `*.md`（`SKILL.md` + `references/*.md`），不含脚本与图片；
- `skill_release/skill-pack-README.md` 会作为包内 `README.md`（教程里最简的用法就是**把 `SKILL.md` 连同 `references/` 拖进 AI 聊天框**）；
- 当前包：66 KB、16 个文件（`plan_skill` 2 / `QQ_push_skill_v2` 7 / `wechat_push_skill` 1 / `push_pic_skill` 4 / `time_skill` 1 + 教程）；
- SHA256 `31E4AD7C1AA517E4F6A44A5E591B4637979E398E8B8F8475F933C68A24B2A3CE`（写死在页面下载区，重建后要同步改；重建前后哈希一致说明打包是确定性的）；
- 页面的线上直链：`https://github.com/tengkongJS-MC/AI_SA-AI_OD-NAU/releases/download/v1.2.0/AIOD-Skills-v1.2.zip`（附件需随 Release 上传）。

## 三、页面能力一览

| 能力 | 说明 |
|---|---|
| **原生滚动** | 使用浏览器默认滚动，**不做任何滚轮劫持 / 阻尼**；顶栏锚点、右侧页码点、下滑提示用原生 `scrollTo({behavior:'smooth'})` 平滑跳转（`prefers-reduced-motion` 下自动改为瞬时） |
| **五套主题** | 经典红（默认）/ 浅蓝 / 浅绿 / 浅黄 / 深色，与应用内主题完全一致；localStorage 记忆；首次访问跟随系统深浅色 |
| **主题切换入口** | ① 界面预览标题栏的五个小圆点；② 顶栏右侧 ☾/☀ 按钮（浅 ↔ 深，会记住上次的浅色主题） |
| **一行大标题** | 「执笔有格，落字成章」单行显示（`white-space:nowrap` + `clamp()` 自适应，窄屏自动缩字号不换行），后半句用主色渐变 |
| **首页创意背景** | ① 稿纸网格（32px 方格 + 径向遮罩渐隐，呼应"公文/稿纸"）② **金句竖排从顶部落下**：随机位置出现 → 边落边**逐字打出**（打字机）→ **渐显** → **渐隐** → 落出画面自动移除；衬线字体、随主题变色。见下方「首页背景：金句飘落」 |
| **界面预览可交互** | 切换 策划案 / QQ / 微信 / 学时 → 左侧字段与右侧成稿同步变化；切换 编辑 / 预览 / 纯文本 三种视图；点「✦ 生成全文」有**逐字流式输出动画**；点「应用」按选中意见改写该段并高亮闪一下，「取消」清除选中 |
| **Skill 用法演示（动画）** | 独立板块「拖进 AI 聊天框就行」：左侧解压后的文件夹把 `SKILL.md` / `references/*.md` **飞进**右侧对话窗变成附件 → 逐字打出需求 → 弹「正在输入」→ 逐字打出成稿 → 标注按哪个 skill 生成 → 停一会儿自动重播。滚到该板块才播、离开即停（`IntersectionObserver`），关动效时直接铺静态结果 |
| **手机适配** | 网格/弹性子项统一 `min-width:0` + `minmax(0,1fr)`（默认 `min-width:auto` 会把整块撑出屏幕）；≤760px 单列、关掉 mockup 的 3D 透视；**≤430px 再收一档**：顶栏 logo/副标题、单行大标题字号、mockup 标题栏与主题圆点、下载卡片按钮都缩小或换行，避免右侧溢出 |
| **动态效果** | 顶部滚动进度条、右侧页码点（hover 显示章节名、点击跳转）、进入视口渐入（带轻微错峰）、Hero 鼠标跟随聚光、mockup 轻微 3D 倾斜、按钮与卡片的 hover 反馈 |

### 首页背景：金句飘落（共 20 句）

一句话说清动画：**顶部随机位置出现（整列竖排）→ 边向下落边逐字打出 → 渐显 → 渐隐 → 落出画面后自动销毁**。

| 参数 | 当前值 | 在哪改 |
|---|---|---|
| 生成节奏 | 每 1.15s 一条 | `<script>` 里的 `setInterval(..., 1150)` |
| 并发上限 | 6 条（<760px 为 3 条） | `var MAX` |
| 下落时长 | 9~15s | `var dur = 9 + Math.random() * 6` |
| 文字方向 | **竖排**（`writing-mode: vertical-rl` + `text-orientation: upright`，字正立） | `.hero-bg .rain span` |
| 字号 | **17~22px**（<760px 为 14~17px） | `var size` |
| 打字速度 | **150~260 ms/字**（逐字放慢） | `speed = 150 + Math.random() * 110` |
| 起点 / 落程 | 整列从画面外（`top` 为负）开始，落到 `--dist = 视口高 + 整列高 + 120` | `el.style.top` / `--dist` |
| 淡显透明度 | 0.10~0.17（深色主题 ×1.4） | `--o` / `html[data-theme="dark"]` 规则 |
| 横向落点 | 72% 概率偏向左右两侧（避免压住标题中区），其余随机全宽 | `if (Math.random() < 0.72)` |
| 关闭动效 | 改为 4 句静态铺底 | `prefers-reduced-motion` 分支 |

**取自 skill 原文（10 句，逐字一致）**

| 句子 | 出处 |
|---|---|
| 以青春之名，赴先锋之约 | `plan_skill/references/knowledge-base.md` 活动主题标语 |
| 星火新程，丹心启航 | 同上 |
| 凝心悟国是，砺志启新程 | 同上 |
| 春华秋实结硕果，先锋领航正当时 | `wechat_push_skill/SKILL.md` 抒情引子（#127） |
| 把论文写在祖国大地上 | `wechat_push_skill/SKILL.md` 学院灵魂句式 |
| 淬言成锋，辩以砺才 | `QQ_push_skill_v2/references/examples.md` 辩论赛标题 |
| 智创未来，篮动青春 | 同上（迎新杯篮球赛） |
| 烟火藏诗意，家味暖同窗 | `wechat_push_skill/SKILL.md` 对仗金句（#176） |
| 让代码与灵感在田间地头碰撞 | `wechat_push_skill/SKILL.md` 学院灵魂句式 |
| 以辩会友，以论启思 | `QQ_push_skill_v2/references/structure_type.md` 标题范例 |

**同风格新写（10 句）**

落笔成文，举事有章 · 文以载道，智以赋能 · 谋定而后动，文成而后行 · 规范为骨，文采为衣 · 笔下有丘壑，屏前有乾坤 · 一字一句，皆有出处 · 策划有据，推送有神 · 以智为犁，以笔为锄 · 严谨立文，从容理事 · 把繁琐交给流程，把表达留给自己

> 换 / 加句子：改 `index.html` 里 `<script>` 的 `PHRASES` 数组即可（条数不限，取样时会跳着取，避免连着重复）。

> 想找回"整页翻页感"又不想劫持滚轮？只需在 CSS 里给 `html` 加一行 `scroll-snap-type: y proximity;`
> （每个 `[data-snap]` 章节都已带 `scroll-snap-align` 能力，是浏览器原生行为，不会有阻尼那种迟滞感）。
> 当前默认**不加**，保持最贴近系统的手感。

## 四、发布到 GitHub Pages（可选）

Pages 的「Deploy from a branch」只支持仓库**根目录**或 **`/docs`**，当前页面在 `site/`：

1. **改名法**：把本目录改为 `docs/` → Settings → Pages → `main` + `/docs`。
2. **Actions 法**：保留 `site/`，加一个 Actions 工作流用 `actions/upload-pages-artifact` 指向 `site/`。

## 五、发新版时要改的地方

| 位置 | 内容 |
|---|---|
| Hero 的 `v1.2.0 · Windows 10/11 · 免安装` | 版本号 |
| Hero 与下载区的 `SHA256`（exe）、下载区的 `SHA256`（skill zip） | 两个文件的校验值 |
| `<script>` 里的 `ASSETS.app` / `ASSETS.skill`（各含 `release` / `local` / `link`） | 两个下载直链、本地文件名，以及下载区「Release 直链」链接的 id |
| 下载区 `<a id="rel-skill">` 的初始 href | 与 `ASSETS.skill.release` 保持一致（JS 加载后会覆盖，仅作无脚本兜底） |
| 下载区 `AIOD-Writer-Go-v1.2.exe`、`AIOD-Skills-v1.2.zip` 文案、页脚 `v1.2.0`、两个 Release 链接 | 版本与命名 |

生成校验值：
```powershell
(Get-FileHash release\go\AI-Writer-Go.exe -Algorithm SHA256).Hash
(Get-FileHash skill_release\AIOD-Skills-v1.2.zip -Algorithm SHA256).Hash
```

## 六、改配色 / 换 Logo

- **Logo**：替换 `site/logo.png` 即可（同时用于顶栏、页脚与 favicon）。
- **配色**：五套主题变量集中在 `index.html` 顶部，每套只改这几行就能换整体气质：
  ```css
  --bg / --bg2            页面底色与渐变
  --card / --card-soft    卡片与浅面板
  --text / --muted        正文与次要文字
  --line / --line-2       分隔线与描边
  --red / --red-2         主色与渐变末端（按钮、强调、进度条）
  --tint1 / --tint2       背景光斑
  --sh                    阴影用的 RGB 三元组（深色主题改为 0,0,0）
  ```

## 七、页面结构

1. 顶栏（吸顶毛玻璃）：Logo、锚点导航（滚动自动高亮）、主题按钮、下载
2. Hero：单行大标题 + 一句话价值 + 卖点 chip + 三 CTA（下载 Windows 版 / 仅下载 Skill 包 / 查看源码）+ SHA256（可复制）+ 下滑提示，背后是稿纸网格与从顶部落下的金句（打字机 + 渐显渐隐）
3. 功能展示：6 张卡（策划案 / QQ / 微信 / 学时 / 配图提示词 / Word 公文导出）
4. **界面预览（可交互 mockup）**：纯 CSS 复刻的应用窗口
5. **Skill 包用法演示（动画）**：解压后的文件夹 → 拖进 AI 聊天框 → 说需求 → 出成稿，循环播放
6. 使用流程：填信息 → 生成全文 → 改写与导出
7. 技术可信：单文件 / 本地回环 / Key 仅存本机 / 模型可选
8. 常见问题（原生 `<details>` 折叠，无 JS）
9. 下载区（桌面程序 exe + 次要块「只要提示词，不要程序？」→ 仅 Skill 包 zip）+ 页脚

> 全部使用系统字体栈，不引外部字体与图片，页面总大小约 **71 KB**（单文件，含全部 CSS/JS）。
