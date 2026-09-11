//go:build windows

package main

import "syscall"

// =============================================================================
//
//	窗口尺寸（两个构建共用）
//	目标 16:10 —— 1440 : 900 = 1.6
//	- go-webview2 的 Width/Height 是「物理像素」，高 DPI 屏上会显得小，故按 DPI 缩放；
//	- Edge 的 --window-size 用的是逻辑像素，所以直接用 targetW/targetH；
//	- 两者都会限制不超过屏幕的 94%，避免小屏超出。
//
// =============================================================================
const (
	targetW = 1440 // 目标宽（逻辑像素）
	targetH = 900  // 目标高（逻辑像素）
	minW    = 1024 // 允许缩到的最小宽
	minH    = 640  // 最小高（1024:640 = 16:10）
)

var (
	user32DLL            = syscall.NewLazyDLL("user32.dll")
	procGetDpiForSystem  = user32DLL.NewProc("GetDpiForSystem")
	procGetSystemMetrics = user32DLL.NewProc("GetSystemMetrics")
)

// dpiScale 返回系统 DPI 缩放比（96 DPI = 1.0）
func dpiScale() float64 {
	if err := procGetDpiForSystem.Find(); err == nil {
		if dpi, _, _ := procGetDpiForSystem.Call(); dpi >= 72 && dpi <= 480 {
			return float64(dpi) / 96.0
		}
	}
	return 1.0
}

// screenSize 返回主屏像素尺寸（SM_CXSCREEN / SM_CYSCREEN）
func screenSize() (int, int) {
	w, _, _ := procGetSystemMetrics.Call(0)
	h, _, _ := procGetSystemMetrics.Call(1)
	return int(w), int(h)
}

// initialWindowSize 计算 WebView2 窗口的初始尺寸（物理像素），保持 16:10 且不超出屏幕
func initialWindowSize() (uint, uint) {
	s := dpiScale()
	sw, sh := screenSize()
	f := 1.0
	if sw > 0 {
		if m := 0.94 * float64(sw) / (float64(targetW) * s); m < f {
			f = m
		}
	}
	if sh > 0 {
		if m := 0.94 * float64(sh) / (float64(targetH) * s); m < f {
			f = m
		}
	}
	w := float64(targetW) * s * f
	h := float64(targetH) * s * f
	if w < float64(minW)*s {
		w = float64(minW) * s
	}
	if h < float64(minH)*s {
		h = float64(minH) * s
	}
	return uint(w + 0.5), uint(h + 0.5)
}
