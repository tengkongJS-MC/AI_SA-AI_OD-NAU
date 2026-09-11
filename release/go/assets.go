package main

import "embed"

// 前端与技能文件全部内嵌进可执行文件（这是"单文件 + 小体积"的关键）
//
//go:embed all:assets
var assetsFS embed.FS

// readAsset 读取内嵌资源，path 形如 assets/public/index.html
func readAsset(path string) (string, bool) {
	b, err := assetsFS.ReadFile(path)
	if err != nil {
		return "", false
	}
	return string(b), true
}
