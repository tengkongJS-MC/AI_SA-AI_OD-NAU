package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func providerByName(dataDir, name string) (*Provider, string, error) {
	cfg := loadConfig(dataDir)
	if name == "" {
		name = cfg.Active
	}
	p := cfg.Providers[name]
	if p == nil {
		return nil, name, fmt.Errorf("提供商不存在：%s", name)
	}
	if strings.TrimSpace(p.APIKey) == "" {
		return nil, name, errors.New("未配置该提供商的 API Key，请点击右上角\"⚙ 模型设置\"填写并保存。")
	}
	return p, name, nil
}

// streamChat 以流式方式调用 OpenAI 兼容接口，逐段回调增量文本
func streamChat(dataDir, providerName string, messages []chatMessage, temperature float64, onDelta func(string)) error {
	p, name, err := providerByName(dataDir, providerName)
	if err != nil {
		return err
	}
	url := strings.TrimRight(p.BaseURL, "/") + "/chat/completions"
	body := map[string]any{"model": p.Model, "messages": messages, "stream": true}
	if name == "deepseek" {
		// DeepSeek V4 默认开启耗时较久的思考模式，这里关闭以换取即时可用
		body["thinking"] = map[string]string{"type": "disabled"}
		body["reasoning_effort"] = "none"
	} else {
		body["temperature"] = temperature
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.APIKey)

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("大模型接口请求失败 (%d) %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}

	type deltaChoice struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	}
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		var parsed struct {
			Choices []deltaChoice `json:"choices"`
		}
		if err := json.Unmarshal([]byte(payload), &parsed); err != nil {
			continue
		}
		if len(parsed.Choices) > 0 {
			if c := parsed.Choices[0].Delta.Content; c != "" {
				onDelta(c)
			}
		}
	}
	return sc.Err()
}

// completeChat 非流式取全部文本（用于连接测试）
func completeChat(dataDir, providerName string, messages []chatMessage, temperature float64) (string, error) {
	var sb strings.Builder
	err := streamChat(dataDir, providerName, messages, temperature, func(s string) { sb.WriteString(s) })
	return sb.String(), err
}
