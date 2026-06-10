// Utilidades compartidas del panel de administración

// Alias de hooks de React compartidos por todos los módulos admin.
// Declaración ÚNICA en el scope global (este archivo carga antes que admin-*.jsx y admin.jsx).
const { useState: useStateA, useMemo: useMemoA } = React;

// Exportar a XLSX usando SheetJS (cargado vía CDN)
const exportXlsx = (filename, sheets) => {
  if (!window.XLSX) { alert("Librería de Excel no disponible."); return; }
  const wb = window.XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = window.XLSX.utils.json_to_sheet(rows);
    window.XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  window.XLSX.writeFile(wb, filename);
};

// =================== Sidebar NAV config ===================
const NAV = [
  { id: "dashboard",   label: "Dashboard",          icon: "home",     color: "#3B82F6" },
  { id: "pos",         label: "Facturar",           icon: "cart",     color: "#0EA5E9" },
  { id: "inventory",   label: "Inventario",         icon: "box",      color: "#22C55E" },
  { id: "ingreso",     label: "Ingreso mercancía",  icon: "truck",    color: "#F59E0B" },
  { id: "vence",       label: "Vencimientos",       icon: "calendar", color: "#EF4444", badge: "5" },
  { id: "proveedores", label: "Proveedores",        icon: "store",    color: "#A16207" },
  { id: "cajeros",     label: "Cajeros y turnos",   icon: "users",    color: "#9CA3AF" },
  { id: "reportes",    label: "Reporte de ventas",  icon: "chart",    color: "#8B5CF6" },
  { id: "ajustes",     label: "Ajustes",            icon: "settings", color: "#6B7280", rol: "Administrador" },
];

// =================== Hub tiles config ===================
const HUB_TILES = [
  { id: "dashboard",   label: "Dashboard",          desc: "Resumen y KPIs",                color: "#1E5BD9", soft: "#DCE7FB", icon: "chart" },
  { id: "inventory",   label: "Inventario",         desc: "Productos y stock",             color: "#0F766E", soft: "#CCFBF1", icon: "box" },
  { id: "ingreso",     label: "Ingreso mercancía",  desc: "Recepción a bodega",            color: "#9333EA", soft: "#F3E8FF", icon: "truck" },
  { id: "vence",       label: "Vencimientos",       desc: "Alertas y umbrales",            color: "#EA580C", soft: "#FFEDD5", icon: "calendar" },
  { id: "proveedores", label: "Proveedores",        desc: "Directorio comercial",          color: "#0891B2", soft: "#CFFAFE", icon: "store" },
  { id: "cajeros",     label: "Cajeros y turnos",   desc: "Personal y aperturas",          color: "#DB2777", soft: "#FCE7F3", icon: "users" },
  { id: "reportes",    label: "Reporte de ventas",  desc: "Análisis filtrable",            color: "#CA8A04", soft: "#FEF3C7", icon: "chart" },
];

// =================== Funciones IA ===================

// Fuzzy string similarity (SequenceMatcher-style ratio)
const similar = (a, b) => {
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.length === 0) return 1;
  const m = shorter.length, n = longer.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = shorter[i-1] === longer[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  return (2 * dp[m][n]) / (m + n);
};

// Match Gemini items against inventory
const matchItems = (geminiItems) => {
  const productos = (window.MOCK && window.MOCK.productos) || [];
  return geminiItems.map(item => {
    let bestMatch = null, bestScore = 0;
    for (const p of productos) {
      const score = similar(item.nombre, p.nombre);
      if (score > bestScore) { bestScore = score; bestMatch = p; }
    }
    if (bestScore > 0.7 && bestMatch) {
      return { ...item, sku: bestMatch.sku, encontrado: true, confianza: Math.round(bestScore * 100) / 100 };
    }
    return { ...item, sku: null, encontrado: false, nuevo: true, confianza: Math.round(bestScore * 100) / 100 };
  });
};

// Presets de proveedores IA
const IA_PRESETS = [
  { id: "gemini",   name: "Gemini",    format: "gemini",  model: "gemini-2.0-flash",         url: "https://generativelanguage.googleapis.com/v1beta",          placeholder: "AIzaSy...",   link: "https://aistudio.google.com/apikey",         linkLabel: "Google AI Studio" },
  { id: "openai",   name: "OpenAI",    format: "openai",  model: "gpt-4o",                   url: "https://api.openai.com/v1/chat/completions",                placeholder: "sk-proj-...", link: "https://platform.openai.com/api-keys",       linkLabel: "OpenAI Platform" },
  { id: "claude",   name: "Claude",    format: "claude",  model: "claude-sonnet-4-20250514", url: "https://api.anthropic.com/v1/messages",                     placeholder: "sk-ant-...",  link: "https://console.anthropic.com/settings/keys",linkLabel: "Anthropic Console" },
  { id: "groq",     name: "Groq",      format: "openai",  model: "llama-4-scout-17b-16e-instruct", url: "https://api.groq.com/openai/v1/chat/completions",    placeholder: "gsk_...",     link: "https://console.groq.com/keys",              linkLabel: "Groq Console" },
  { id: "openrouter", name: "OpenRouter", format: "openai", model: "google/gemini-2.0-flash-exp:free", url: "https://openrouter.ai/api/v1/chat/completions",  placeholder: "sk-or-...",   link: "https://openrouter.ai/keys",                 linkLabel: "OpenRouter" },
  { id: "custom",   name: "Otro",      format: "openai",  model: "",                         url: "",                                                          placeholder: "tu-api-key",  link: "",                                           linkLabel: "" },
];

// Auto-detectar formato y modelo desde la URL
const detectFromUrl = (url) => {
  const u = (url || "").toLowerCase();
  for (const p of IA_PRESETS) {
    if (p.url && u.includes(new URL(p.url).hostname)) return { format: p.format, model: p.model, provider: p.id };
  }
  if (u.includes("googleapis.com") || u.includes("generativelanguage")) return { format: "gemini", model: "gemini-2.0-flash", provider: "gemini" };
  if (u.includes("anthropic.com")) return { format: "claude", model: "claude-sonnet-4-20250514", provider: "claude" };
  return { format: "openai", model: "gpt-4o", provider: "custom" };
};

// Load full provider config
const getIAConfig = () => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  const url = cfg.ia_url || "";
  const detected = detectFromUrl(url);
  return {
    format: cfg.ia_format || detected.format,
    model: cfg.ia_model || detected.model,
    url: url,
    apiKey: cfg.ia_api_key || "",
    name: detected.provider,
  };
};

const PROMPT_FACTURA = `Analiza esta factura/remisión. Extrae JSON estricto:
{ "proveedor": "...", "nit": "...", "factura": "...", "fecha": "...", "vendedor": "...", "celular": "...",
  "items": [{ "nombre": "...", "qty": 0, "costo": 0, "vence": "YYYY-MM-DD o null" }] }
Solo JSON, sin markdown ni explicaciones. Si un campo no es visible, usa null. qty y costo deben ser números.`;

// Parse API error into friendly message
const parseApiError = (status, body, provider) => {
  try {
    const json = JSON.parse(body);
    const msg = json.error?.message || json.error?.type || "";
    if (status === 429 || msg.includes("quota") || msg.includes("rate")) {
      return `Límite de uso alcanzado en ${provider}. Espera unos segundos e intenta de nuevo, o cambia de proveedor en Ajustes.`;
    }
    if (status === 401 || status === 403 || msg.includes("auth") || msg.includes("key")) {
      return `API Key de ${provider} inválida o sin permisos. Revísala en Ajustes.`;
    }
    if (status === 400) {
      return `${provider} rechazó la solicitud. La imagen puede ser demasiado grande o el formato no es compatible.`;
    }
    if (msg) return `${provider}: ${msg.slice(0, 150)}`;
  } catch {}
  if (status === 429) return `Límite de uso alcanzado en ${provider}. Espera e intenta de nuevo.`;
  if (status === 401 || status === 403) return `API Key de ${provider} inválida. Revísala en Ajustes.`;
  if (status >= 500) return `Servidor de ${provider} no disponible. Intenta más tarde.`;
  return `Error de ${provider} (${status}). Intenta de nuevo.`;
};

// Call AI Vision API (multi-provider)
const analizarConIA = async (base64, mimeType) => {
  const cfg = getIAConfig();
  if (!cfg.apiKey) throw new Error("Configura tu API Key en Ajustes antes de usar el escáner IA.");
  const label = cfg.name || cfg.id;
  let text;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 60000);

  try {
  if (cfg.format === "claude") {
    const res = await fetch(cfg.url || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 2048,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: PROMPT_FACTURA }
        ]}],
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.content?.[0]?.text;

  } else if (cfg.format === "gemini") {
    const buildGeminiUrl = () => {
      const model = cfg.model || "gemini-2.0-flash";
      if (!cfg.url) return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
      let u = cfg.url.split("?")[0].replace(/\/+$/, "");
      if (!u.includes("/models/")) u += `/models/${model}:generateContent`;
      else if (!u.includes(":generateContent")) u += ":generateContent";
      return u + `?key=${cfg.apiKey}`;
    };
    const url = buildGeminiUrl();
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: PROMPT_FACTURA }
      ]}]}),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.candidates?.[0]?.content?.parts?.[0]?.text;

  } else {
    const endpoint = cfg.url || "https://api.openai.com/v1/chat/completions";
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: PROMPT_FACTURA }
        ]}],
        max_tokens: 2048,
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.choices?.[0]?.message?.content;
  }
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`${label} tardó demasiado (>60s). Intenta con una imagen más pequeña o cambia de proveedor IA en Ajustes.`);
    throw e;
  } finally { clearTimeout(tid); }

  if (!text) throw new Error("La IA no devolvió resultado. Intenta con una imagen más clara.");
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(clean); }
  catch { throw new Error("La IA devolvió un formato inválido. Intenta con una foto más clara de la factura."); }
};

// Datos simulados que devolvería la lectura del QR DIAN
const MOCK_QR_DIAN = {
  proveedor: "Distribuidora El Sol",
  nit: "900.124.567-8",
  factura: "FE-2026-001284",
  cufe: "8b3f9c2e1a7d4f6e9c2a8b3f...",
  fecha: "2026-05-22 10:42",
  vendedor: "Carlos Pérez",
  celular: "300 123 4567",
  items: [
    { sku: "7702001", nombre: "Leche entera 1L",     qty: 48, costo: 3200, vence: "2026-06-18", encontrado: true },
    { sku: "7720001", nombre: "Arroz blanco 1kg",    qty: 30, costo: 3700, vence: "2027-04-15", encontrado: true },
    { sku: "7730001", nombre: "Aceite girasol 1L",   qty: 20, costo: 11000, vence: "2026-10-05", encontrado: true },
    { sku: "7760001", nombre: "Huevos AA x12",       qty: 15, costo: 10500, vence: "2026-06-12", encontrado: true },
  ],
};

// Datos simulados que devolvería el OCR + IA al escanear la foto
const MOCK_OCR_IA = {
  proveedor: "Lácteos del Valle",
  nit: "830.998.221-2",
  factura: "LV-8821",
  fecha: "2026-05-22 11:15",
  vendedor: "María González",
  celular: "320 555 7788",
  items: [
    { sku: "7702002", nombre: "Yogurt natural 1L",    qty: 20, costo: 5500, vence: "2026-06-15", encontrado: true,  confianza: 0.96 },
    { sku: null,      nombre: "Queso Campesino 500g", qty: 12, costo: 9800, vence: "2026-06-08", encontrado: false, confianza: 0.91, nuevo: true },
    { sku: "7702004", nombre: "Mantequilla 250g",     qty: 18, costo: 4200, vence: "2026-08-20", encontrado: true,  confianza: 0.88 },
  ],
};

Object.assign(window, { exportXlsx, NAV, HUB_TILES, similar, matchItems, IA_PRESETS, detectFromUrl, getIAConfig, PROMPT_FACTURA, parseApiError, analizarConIA, MOCK_QR_DIAN, MOCK_OCR_IA });
