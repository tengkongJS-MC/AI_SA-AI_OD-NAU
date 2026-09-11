package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// openEdgeWindow 用系统 Edge 的「应用模式」打开一个无地址栏的窗口并阻塞到关闭。
// 纯标准库实现（零第三方依赖），因此默认构建不需要联网拉取任何模块。
// 窗口大小用 --window-size 指定（Edge 用的是逻辑像素，16:10 → 1440×900）。
func openEdgeWindow(url, dataDir string) {
	profile := filepath.Join(dataDir, "edge-profile")
	_ = os.MkdirAll(profile, 0o755)

	candidates := []string{
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
	}
	for _, exe := range candidates {
		if _, err := os.Stat(exe); err != nil {
			continue
		}
		cmd := exec.Command(exe,
			"--app="+url,
			"--user-data-dir="+profile,
			fmt.Sprintf("--window-size=%d,%d", targetW, targetH),
			"--no-first-run",
			"--no-default-browser-check",
		)
		_ = cmd.Run() // 阻塞直到用户关闭窗口
		return
	}
	// 找不到 Edge：退回系统默认浏览器（服务继续运行）
	_ = exec.Command("cmd", "/c", "start", "", url).Run()
}
