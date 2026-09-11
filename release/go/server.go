package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"path"
	"strconv"
	"strings"
)

type appServer struct{ dataDir string }

var mimeByExt = map[string]string{
	".html":  "text/html; charset=utf-8",
	".js":    "text/javascript; charset=utf-8",
	".css":   "text/css; charset=utf-8",
	".json":  "application/json; charset=utf-8",
	".svg":   "image/svg+xml",
	".png":   "image/png",
	".jpg":   "image/jpeg",
	".jpeg":  "image/jpeg",
	".gif":   "image/gif",
	".webp":  "image/webp",
	".ico":   "image/x-icon",
	".woff2": "font/woff2",
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func errorJSON(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func startServer(dataDir string, basePort int) (*http.Server, int, error) {
	s := &appServer{dataDir: dataDir}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/config", s.handleConfig)
	mux.HandleFunc("/api/modes", s.handleModes)
	mux.HandleFunc("/api/test", s.handleTest)
	mux.HandleFunc("/api/chat", s.handleChat)
	mux.HandleFunc("/api/import-docx", s.handleImportDocx)
	mux.HandleFunc("/api/export-docx", s.handleExportDocx)
	mux.HandleFunc("/", s.handleStatic)

	for port := basePort; port < basePort+10; port++ {
		ln, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(port))
		if err != nil {
			continue
		}
		srv := &http.Server{Handler: mux}
		go func() { _ = srv.Serve(ln) }()
		return srv, port, nil
	}
	return nil, 0, fmt.Errorf("端口 %d-%d 都被占用", basePort, basePort+9)
}

// ---------- /api/config ----------
func (s *appServer) handleConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, publicConfig(s.dataDir))
	case http.MethodPost:
		var body struct {
			Active    string `json:"active"`
			Providers map[string]struct {
				APIKey  *string `json:"apiKey"`
				Model   *string `json:"model"`
				BaseURL *string `json:"baseUrl"`
			} `json:"providers"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
			errorJSON(w, http.StatusBadRequest, "请求体解析失败")
			return
		}
		cfg := loadConfig(s.dataDir)
		if body.Active != "" {
			if _, ok := cfg.Providers[body.Active]; ok {
				cfg.Active = body.Active
			}
		}
		for key, incoming := range body.Providers {
			p := cfg.Providers[key]
			if p == nil {
				continue
			}
			if incoming.APIKey != nil {
				p.APIKey = strings.TrimSpace(*incoming.APIKey)
			}
			if incoming.Model != nil {
				if m := strings.TrimSpace(*incoming.Model); m != "" {
					p.Model = m
				}
			}
			if incoming.BaseURL != nil {
				if u := strings.TrimSpace(*incoming.BaseURL); u != "" {
					p.BaseURL = u
				}
			}
		}
		if err := saveConfig(s.dataDir, cfg); err != nil {
			errorJSON(w, http.StatusInternalServerError, "保存配置失败："+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, publicConfig(s.dataDir))
	default:
		errorJSON(w, http.StatusMethodNotAllowed, "方法不支持")
	}
}

// ---------- /api/modes ----------
func (s *appServer) handleModes(w http.ResponseWriter, r *http.Request) {
	type promptInfo struct {
		Mode string `json:"mode"`
		Len  int    `json:"len"`
	}
	prompts := make([]promptInfo, 0, len(allModes))
	for _, m := range allModes {
		prompts = append(prompts, promptInfo{Mode: m, Len: len([]rune(buildSystemPrompt(m)))})
	}
	writeJSON(w, http.StatusOK, map[string]any{"modes": allModes, "prompts": prompts})
}

// ---------- /api/test ----------
func (s *appServer) handleTest(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Provider string `json:"provider"`
	}
	_ = json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body)
	if _, _, err := providerByName(s.dataDir, body.Provider); err != nil {
		errorJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	reply, err := completeChat(s.dataDir, body.Provider, []chatMessage{
		{Role: "system", Content: "你是一个连通性测试助手，请只回复两个字：正常。"},
		{Role: "user", Content: "测试"},
	}, 0)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	runes := []rune(reply)
	if len(runes) > 80 {
		runes = runes[:80]
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "reply": string(runes)})
}

// ---------- /api/chat（流式） ----------
func (s *appServer) handleChat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Mode        string        `json:"mode"`
		Messages    []chatMessage `json:"messages"`
		Temperature *float64      `json:"temperature"`
		Provider    string        `json:"provider"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 8<<20)).Decode(&body); err != nil {
		errorJSON(w, http.StatusBadRequest, "请求体解析失败")
		return
	}
	if !isValidMode(body.Mode) {
		errorJSON(w, http.StatusBadRequest, "无效的 mode")
		return
	}
	if len(body.Messages) == 0 {
		errorJSON(w, http.StatusBadRequest, "messages 不能为空")
		return
	}
	// 先校验配置，缺失 Key 时返回干净的 JSON 错误
	if _, _, err := providerByName(s.dataDir, body.Provider); err != nil {
		errorJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	full := make([]chatMessage, 0, len(body.Messages)+1)
	full = append(full, chatMessage{Role: "system", Content: buildSystemPrompt(body.Mode)})
	full = append(full, body.Messages...)
	temp := 0.7
	if body.Temperature != nil {
		temp = *body.Temperature
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher, _ := w.(http.Flusher)

	err := streamChat(s.dataDir, body.Provider, full, temp, func(part string) {
		_, _ = io.WriteString(w, part)
		if flusher != nil {
			flusher.Flush()
		}
	})
	if err != nil {
		_, _ = io.WriteString(w, "\n\n[错误] "+err.Error())
		return
	}
	if flusher != nil {
		flusher.Flush()
	}
}

// ---------- /api/import-docx ----------
func (s *appServer) handleImportDocx(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "方法不支持")
		return
	}
	raw, err := io.ReadAll(io.LimitReader(r.Body, 25<<20))
	if err != nil || len(raw) == 0 {
		errorJSON(w, http.StatusBadRequest, "未接收到文件内容")
		return
	}
	text, err := extractDocxText(raw)
	if err != nil {
		errorJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"text": text, "chars": len([]rune(text))})
}

// ---------- /api/export-docx ----------
func (s *appServer) handleExportDocx(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "方法不支持")
		return
	}
	var body struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 8<<20)).Decode(&body); err != nil {
		errorJSON(w, http.StatusBadRequest, "请求体解析失败")
		return
	}
	if strings.TrimSpace(body.Text) == "" {
		errorJSON(w, http.StatusBadRequest, "内容为空")
		return
	}
	data, err := buildDocxBytes(body.Text)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "导出失败："+err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	w.Header().Set("Content-Disposition", `attachment; filename="export.docx"`)
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// ---------- 静态资源（内嵌前端） ----------
func (s *appServer) handleStatic(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.NotFound(w, r)
		return
	}
	rel := path.Clean("/" + strings.TrimPrefix(r.URL.Path, "/"))
	if rel == "/" || rel == "/index.html" {
		rel = "/index.html"
	}
	content, ok := readAsset("assets/public" + rel)
	if !ok {
		http.NotFound(w, r)
		return
	}
	ct := mimeByExt[strings.ToLower(path.Ext(rel))]
	if ct == "" {
		ct = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Content-Length", strconv.Itoa(len(content)))
	_, _ = io.WriteString(w, content)
}
