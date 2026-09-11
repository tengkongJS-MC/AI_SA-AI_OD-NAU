package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

// Provider 一个 OpenAI 兼容的模型提供商
type Provider struct {
	Label   string `json:"label"`
	BaseURL string `json:"baseUrl"`
	APIKey  string `json:"apiKey"`
	Model   string `json:"model"`
}

// Config 模型配置
type Config struct {
	Active    string               `json:"active"`
	Providers map[string]*Provider `json:"providers"`
}

func defaultConfig() *Config {
	return &Config{
		Active: "zhipu",
		Providers: map[string]*Provider{
			"zhipu": {
				Label:   "智谱AI · GLM-4.7-Flash（免费）",
				BaseURL: "https://open.bigmodel.cn/api/paas/v4",
				Model:   "glm-4.7-flash",
			},
			"deepseek": {
				Label:   "DeepSeek · deepseek-v4-flash",
				BaseURL: "https://api.deepseek.com",
				Model:   "deepseek-v4-flash",
			},
		},
	}
}

func configPath(dataDir string) string { return filepath.Join(dataDir, "config.json") }

func loadConfig(dataDir string) *Config {
	cfg := defaultConfig()
	b, err := os.ReadFile(configPath(dataDir))
	if err != nil {
		return cfg
	}
	var parsed Config
	if err := json.Unmarshal(b, &parsed); err != nil {
		return cfg
	}
	if parsed.Active != "" {
		cfg.Active = parsed.Active
	}
	if parsed.Providers != nil {
		for k, v := range parsed.Providers {
			if v == nil {
				continue
			}
			base := cfg.Providers[k]
			if base == nil {
				base = &Provider{}
				cfg.Providers[k] = base
			}
			if v.Label != "" {
				base.Label = v.Label
			}
			if v.BaseURL != "" {
				base.BaseURL = v.BaseURL
			}
			if v.Model != "" {
				base.Model = v.Model
			}
			base.APIKey = v.APIKey
		}
	}
	return cfg
}

func saveConfig(dataDir string, cfg *Config) error {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configPath(dataDir), b, 0o644)
}

// publicConfig 返回给前端的安全视图（不含 apiKey）
func publicConfig(dataDir string) map[string]any {
	cfg := loadConfig(dataDir)
	providers := map[string]any{}
	for k, p := range cfg.Providers {
		providers[k] = map[string]any{
			"label":   p.Label,
			"baseUrl": p.BaseURL,
			"model":   p.Model,
			"hasKey":  strings.TrimSpace(p.APIKey) != "",
		}
	}
	return map[string]any{"active": cfg.Active, "providers": providers}
}

// defaultDataDir 默认配置目录：%APPDATA%\AI-Writer-Desktop
func defaultDataDir() string {
	if v := os.Getenv("AI_WRITER_DATA"); v != "" {
		return v
	}
	if appData := os.Getenv("APPDATA"); appData != "" {
		return filepath.Join(appData, "AI-Writer-Desktop")
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return filepath.Join(home, "AppData", "Roaming", "AI-Writer-Desktop")
}
