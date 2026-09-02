const configStore = require('./config');

// 校验某提供商是否已就绪（存在且有 API Key）
function assertReady(provider) {
  const p = provider || configStore.loadConfig().active;
  const cfg = configStore.loadConfig().providers[p];
  if (!cfg) throw new Error('提供商不存在：' + p);
  if (!cfg.apiKey || !cfg.apiKey.trim()) {
    throw new Error('未配置该提供商的 API Key，请点击右上角"⚙ 模型设置"填写并保存。');
  }
}

// 组装 OpenAI 兼容的 chat 请求体
function buildChatRequest({ provider, messages, temperature = 0.7 }) {
  assertReady(provider);
  const p = provider || configStore.loadConfig().active;
  const cfg = configStore.loadConfig().providers[p];
  const baseUrl = (cfg.baseUrl || '').replace(/\/+$/, '');
  const url = baseUrl + '/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + cfg.apiKey
  };
  const body = {
    model: cfg.model,
    messages,
    stream: true
  };
  // DeepSeek V4 默认开启高耗时的思考模式（首字延迟可达数十秒）。
  // 本工具用于文书撰写，直接关闭思考以换取即时可用。
  if (p === 'deepseek') {
    body.thinking = { type: 'disabled' };
    body.reasoning_effort = 'none';
  } else {
    body.temperature = temperature;
  }
  return { url, headers, body };
}

/**
 * 流式调用大模型。onDelta(textPart) 逐段回调增量文本；
 * 解析 OpenAI SSE 的 data:[DONE] 及 data:{...choices[].delta.content}
 */
async function streamChat({ provider, messages, temperature, onDelta, signal }) {
  const { url, headers, body } = buildChatRequest({ provider, messages, temperature });
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal
  });
  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    throw new Error('大模型接口请求失败 (' + resp.status + ') ' + errText.slice(0, 300));
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留可能不完整的一行
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        if (delta && typeof delta.content === 'string') {
          onDelta(delta.content);
        }
      } catch (e) {
        // 忽略非 JSON 的 keep-alive 行
      }
    }
  }
}

async function completeChat({ provider, messages, temperature }) {
  let full = '';
  await streamChat({ provider, messages, temperature, onDelta: (c) => { full += c; } });
  return full;
}

module.exports = { streamChat, completeChat, buildChatRequest, assertReady };
