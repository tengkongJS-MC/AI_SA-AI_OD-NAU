//go:build webview2

package main

import webview2 "github.com/jchv/go-webview2"

// go-winres 把 logo.png 写进 exe 的图标资源 ID（默认 1）。
// 若窗口标题栏图标没显示，可依次改成 2、3 试试。
const iconResID = 1

// 真·原生窗口（WebView2，嵌入窗口、无浏览器外壳）：
//
//	go build -tags webview2 -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .
//
// 需要系统已安装 WebView2 运行时（Win10/11 一般自带）。
// 默认窗口 16:10（1440×900 逻辑像素，按 DPI 缩放且不超出屏幕）；
// 想改大小请编辑 windowsize.go 里的 targetW / targetH（保持 1.6 倍关系即为 16:10）。
func runWindow(url, title, dataDir string) {
	ww, wh := initialWindowSize()
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  title,
			Width:  ww,
			Height: wh,
			IconId: iconResID,
			Center: true,
		},
	})
	if w == nil {
		// 没有 WebView2 运行时：退回 Edge 应用模式
		openEdgeWindow(url, dataDir)
		return
	}
	defer w.Destroy()
	// 允许用户缩小，但不小于 1024×640（同为 16:10）
	s := dpiScale()
	w.SetSize(int(float64(minW)*s), int(float64(minH)*s), webview2.HintMin)
	w.Navigate(url)
	w.Run()
}
