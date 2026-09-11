# Go 版桌面应用（`release/go`）

后端用 **Go 重写**，前端与技能文件用 `go:embed` 内嵌，
编译出**一个几 MB 的 exe**：不需要 Rust、不需要 Visual Studio，也不需要目标机器额外装运行时。

> ✅ **本目录已包含构建好的成品**：`release/go/AI-Writer-Go.exe`（**8.4 MB**，WebView2 原生窗口版）。
> 已验证：内嵌前端正常、5 个技能正常加载、配置读写正常、Word 导出→回导往返正常（含预算表格，且待确认清单不导出）。
> 窗口默认 **16:10、1440×900**（按 DPI 缩放，最小 1024×640），详见第「窗口大小」一节。

## 构建方式与体积

| 构建方式 | 体积 | 需要装什么 |
|---|---|---|
| **默认构建**（Edge 应用模式窗口） | **≈ 3–4 MB** | 只装 Go |
| **`-tags webview2`**（原生 WebView2 窗口，当前成品） | **≈ 8.4 MB** | 装 Go + `go get` 一个库 |

## 一、环境准备（只有一步）

1. 安装 **Go ≥ 1.22**：<https://go.dev/dl/>（Windows 下 `.msi` 一路下一步，**不需要 Visual Studio**）
2. 验证：`go version`

> 默认构建**不依赖任何第三方模块**（连模块代理都不用联网）；
> 只有 `-tags webview2` 需要 `go get github.com/jchv/go-webview2`（本目录已含 `go.mod`/`go.sum`）。

## 二、构建

```powershell
cd release\go

# 方式一：默认构建 —— 单文件、用系统 Edge 的「应用模式」开窗口（无地址栏）
go build -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .

# 方式二（当前成品）：真·原生 WebView2 窗口（嵌入窗口，无浏览器外壳）
go build -tags webview2 -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .
```

- `-H windowsgui`：双击运行**不弹黑色控制台窗口**
- `-s -w`：去掉符号表/调试信息，进一步减小体积

调试（想看日志、不开窗口）：
```powershell
.\AI-Writer-Go.exe -no-window -port 5503 -data "D:\tmp\aiwriter"
```

## 三、目录结构

```
release/go/
├─ AI-Writer-Go.exe           ★ 已构建成品（8.4 MB，webview2 版）
├─ go.mod / go.sum            module aiwriter
├─ main.go                    入口：起服务 → 开窗口 → 关窗退出
├─ server.go                  HTTP 服务（与网页版 API 完全一致）
├─ skills.go                  按功能拼装系统提示词（含排版/列表约束）
├─ llm.go                     OpenAI 兼容流式调用（手写 SSE 解析）
├─ docx.go                    .docx 导出（公文排版/封面/预算真实表格）与导入
├─ config.go                  配置读写（%APPDATA%\AI-Writer-Desktop\config.json）
├─ assets.go                  go:embed 内嵌资源
├─ windowsize.go              ★ 窗口尺寸（16:10、DPI 缩放、最小尺寸）—— 改窗口大小改这里
├─ window_edge.go             Edge 应用模式窗口（纯标准库）
├─ runwindow_default.go       默认构建的 runWindow
├─ runwindow_webview2.go      -tags webview2 的原生窗口（含图标资源 ID）
├─ logo.png / rsrc_*.syso     图标源图与 go-winres 生成的资源（exe 图标）
├─ sync-assets.ps1            把前端与技能文件同步进 assets/
└─ assets/                    内嵌资源（前端 public + 5 个 skill 的 md）
```

## 四点五、窗口大小（16:10）

默认窗口为 **1440×900（16:10）**：

- **WebView2 版**：`windowsize.go` 里按系统 DPI 缩放（高 DPI 屏不会显得小），
  并限制不超过屏幕的 94%，同时设了最小尺寸 **1024×640**（同为 16:10）；
- **默认/Edge 版**：用 `--window-size=1440,900` 传给 Edge（Edge 用逻辑像素）。

**想改默认大小**：只改 `windowsize.go` 顶部的两个常量即可（保持 1.6 倍关系就是 16:10）：

```go
const (
	targetW = 1440 // 想更大就 1600 / 1728
	targetH = 900  // 对应 1000 / 1080
	minW    = 1024
	minH    = 640
)
```

改完重新编译：

```powershell
cd release\go
go build -tags webview2 -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .
```

> 窗口图标：`go-winres` 生成的 `rsrc_windows_amd64.syso` 已把 `logo.png` 写进 exe；
> `runwindow_webview2.go` 里 `iconResID = 1` 用于标题栏图标，若标题栏没显示可改成 2 或 3。

## 四、API 与网页版一致

| 接口 | 说明 |
|---|---|
| `GET  /api/config` | 读取配置（不含 Key） |
| `POST /api/config` | 保存提供商与 API Key |
| `GET  /api/modes` | 各功能提示词规模（自检） |
| `POST /api/test` | 连接测试 |
| `POST /api/chat` | 流式生成（`text/plain` 增量，SSE 解析上游） |
| `POST /api/import-docx` | 解析 .docx 提取文本 |
| `POST /api/export-docx` | 导出公文版 .docx（含封面、预算真实表格、不导出待确认清单） |
| `GET  /` | 内嵌前端 |

因此现有 `ai-writer-app/public` 前端**无需任何改动**即可对接。

## 五、改了前端/技能后要重新同步资源

内嵌资源是从 `release/go/assets/` 复制的；改了 `ai-writer-app/public` 或任一 skill 后执行：

```powershell
cd release\go
powershell -ExecutionPolicy Bypass -File .\sync-assets.ps1
go build -tags webview2 -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .
```

## 六、注意事项

- 默认构建需要系统有 **Microsoft Edge**（Win10/11 自带）；`-tags webview2` 需要 **WebView2 运行时**（一般自带）。
- 数据目录：`%APPDATA%\AI-Writer-Desktop\`（`config.json` 存 API Key）；也可用 `-data "D:\somewhere"` 指定。
- 端口默认 5503，被占用会自动顺延到 5504…5513。
- exe 未做代码签名，SmartScreen 可能提示（“更多信息 → 仍要运行”）。
