(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var IA_PRESETS = [
    { id: "gemini",     name: "Gemini",      format: "gemini",  model: "gemini-2.0-flash",                  url: "https://generativelanguage.googleapis.com/v1beta",           placeholder: "AIzaSy...",   link: "https://aistudio.google.com/apikey",          linkLabel: "Google AI Studio" },
    { id: "openai",     name: "OpenAI",      format: "openai",  model: "gpt-4o",                            url: "https://api.openai.com/v1/chat/completions",                 placeholder: "sk-proj-...", link: "https://platform.openai.com/api-keys",        linkLabel: "OpenAI Platform" },
    { id: "claude",     name: "Claude",      format: "claude",  model: "claude-sonnet-4-20250514",          url: "https://api.anthropic.com/v1/messages",                      placeholder: "sk-ant-...",  link: "https://console.anthropic.com/settings/keys", linkLabel: "Anthropic Console" },
    { id: "groq",       name: "Groq",        format: "openai",  model: "llama-4-scout-17b-16e-instruct",   url: "https://api.groq.com/openai/v1/chat/completions",            placeholder: "gsk_...",     link: "https://console.groq.com/keys",               linkLabel: "Groq Console" },
    { id: "openrouter", name: "OpenRouter",  format: "openai",  model: "google/gemini-2.0-flash-exp:free",  url: "https://openrouter.ai/api/v1/chat/completions",              placeholder: "sk-or-...",   link: "https://openrouter.ai/keys",                  linkLabel: "OpenRouter" },
    { id: "custom",     name: "Otro",        format: "openai",  model: "",                                  url: "",                                                           placeholder: "tu-api-key",  link: "",                                            linkLabel: "" },
  ];
  var detectFromUrl = function (url) {
    var u = (url || "").toLowerCase();
    for (var i = 0; i < IA_PRESETS.length; i++) {
      var p = IA_PRESETS[i];
      if (p.url && u.includes(new URL(p.url).hostname))
        return { format: p.format, model: p.model, provider: p.id };
    }
    if (u.includes("googleapis.com") || u.includes("generativelanguage"))
      return { format: "gemini", model: "gemini-2.0-flash", provider: "gemini" };
    if (u.includes("anthropic.com"))
      return { format: "claude", model: "claude-sonnet-4-20250514", provider: "claude" };
    return { format: "openai", model: "gpt-4o", provider: "custom" };
  };
  var getIAConfig = function (store) {
    var cfg = (store && store.configuracion) || {};
    var url = cfg.ia_url || "";
    var detected = detectFromUrl(url);
    return { format: cfg.ia_format || detected.format, model: cfg.ia_model || detected.model, url: url, apiKey: cfg.ia_api_key || "", name: detected.provider };
  };
  var PROMPT_FACTURA = "Analiza esta factura/remision. Extrae JSON estricto:\n{ \"proveedor\": \"...\", \"nit\": \"...\", \"factura\": \"...\", \"fecha\": \"...\", \"vendedor\": \"...\", \"celular\": \"...\",\n  \"items\": [{ \"nombre\": \"...\", \"qty\": 0, \"costo\": 0, \"vence\": \"YYYY-MM-DD o null\" }] }\nSolo JSON, sin markdown ni explicaciones. Si un campo no es visible, usa null. qty y costo deben ser numeros.";
  var parseApiError = function (status, body, provider) {
    try {
      var json = JSON.parse(body);
      var msg = (json.error && json.error.message) || (json.error && json.error.type) || "";
      if (status === 429 || msg.includes("quota") || msg.includes("rate")) return "Limite de uso alcanzado en " + provider + ".";
      if (status === 401 || status === 403 || msg.includes("auth") || msg.includes("key")) return "API Key de " + provider + " invalida. Revísala en Ajustes.";
      if (status === 400) return provider + " rechazo la solicitud.";
      if (msg) return provider + ": " + msg.slice(0, 150);
    } catch (e) {}
    if (status === 429) return "Limite de uso alcanzado en " + provider + ".";
    if (status === 401 || status === 403) return "API Key de " + provider + " invalida.";
    if (status >= 500) return "Servidor de " + provider + " no disponible.";
    return "Error de " + provider + " (" + status + ").";
  };
  root.AiProviderConfig = { IA_PRESETS: IA_PRESETS, detectFromUrl: detectFromUrl, getIAConfig: getIAConfig, PROMPT_FACTURA: PROMPT_FACTURA, parseApiError: parseApiError };
  window.IA_PRESETS = IA_PRESETS; window.detectFromUrl = detectFromUrl;
  window.getIAConfig = function () { return getIAConfig(window.MOCK); };
  window.PROMPT_FACTURA = PROMPT_FACTURA; window.parseApiError = parseApiError;
})();
