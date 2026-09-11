// =============================================================================
//
//	智农 · AI 组织部 写作助手 —— Go 单文件桌面版
//	在进程内跑 HTTP 服务（前端与技能全部内嵌），再用系统 Edge/WebView2 开窗口。
//	构建：
//	  go build -ldflags "-H windowsgui -s -w" -o AI-Writer-Go.exe .
//	说明：-H windowsgui 让双击运行不弹控制台窗口。
//
// =============================================================================
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func main() {
	dataFlag := flag.String("data", "", "数据目录（默认 %APPDATA%\\AI-Writer-Desktop）")
	portFlag := flag.Int("port", 5503, "本地服务端口（被占用会自动顺延）")
	noWindow := flag.Bool("no-window", false, "仅启动服务、不打开窗口（调试用）")
	flag.Parse()

	dataDir := *dataFlag
	if dataDir == "" {
		dataDir = defaultDataDir()
	}
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		fmt.Fprintln(os.Stderr, "无法创建数据目录：", err)
		os.Exit(1)
	}
	if exe, err := os.Executable(); err == nil {
		_ = os.Chdir(filepath.Dir(exe))
	}

	srv, port, err := startServer(dataDir, *portFlag)
	if err != nil {
		fmt.Fprintln(os.Stderr, "启动失败：", err)
		os.Exit(1)
	}

	url := fmt.Sprintf("http://127.0.0.1:%d", port)
	fmt.Println("◆ 智农 · AI 组织部 写作助手（Go 版）")
	fmt.Println("  服务地址：", url)
	fmt.Println("  数据目录：", dataDir)

	if *noWindow {
		for {
			time.Sleep(time.Hour)
		}
	}

	runWindow(url, "智农 · AI 组织部 写作助手", dataDir)
	_ = srv.Close()
}
