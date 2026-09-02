const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULTS = {
  active: 'zhipu',
  providers: {
    zhipu: {
      label: '智谱AI · GLM-4.7-Flash（免费）',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '',
      model: 'glm-4.7-flash'
    },
    deepseek: {
      label: 'DeepSeek · deepseek-v4-flash',
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      model: 'deepseek-v4-flash'
    }
  }
};

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      active: parsed.active || DEFAULTS.active,
      providers: Object.assign({}, DEFAULTS.providers, parsed.providers || {})
    };
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function saveConfig(cfg) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  return cfg;
}

function publicConfig() {
  const c = loadConfig();
  const out = {
    active: c.active,
    providers: {}
  };
  for (const key of Object.keys(c.providers)) {
    const p = c.providers[key];
    out.providers[key] = {
      label: p.label,
      baseUrl: p.baseUrl,
      model: p.model,
      hasKey: !!(p.apiKey && p.apiKey.trim())
    };
  }
  return out;
}

module.exports = { loadConfig, saveConfig, publicConfig, DEFAULTS };
