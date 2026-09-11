//go:build !webview2

package main

// 默认构建（无第三方依赖）：用 Edge 应用模式开窗口
func runWindow(url, title, dataDir string) {
	openEdgeWindow(url, dataDir)
}
