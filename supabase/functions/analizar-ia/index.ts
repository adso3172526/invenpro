// Edge Function: analizar-ia
// Proxy server-side del escaner IA (factura/remision). El navegador manda la
// imagen (base64 + mimeType); aqui se lee la config + API key desde la tabla
// `configuracion` con el SERVICE ROLE y se llama al proveedor (Gemini /
// OpenAI-compatibles / Claude). Asi la API key NUNCA llega al navegador.
//
// Robustez: cada llamada al proveedor tiene timeout (AbortController) y 1 reintento
// ante saturacion (429/503) o cuelgue, para no devolver "non-2xx" al navegador.
//
// Despliegue:  supabase functions deploy analizar-ia   (slug EXACTO: analizar-ia)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const PROMPT = "Analiza esta factura/remision. Extrae JSON estricto:\n" +
  "{ \"proveedor\": \"...\", \"nit\": \"...\", \"factura\": \"...\", \"fecha\": \"...\", \"vendedor\": \"...\", \"celular\": \"...\",\n" +
  "  \"items\": [{ \"nombre\": \"...\", \"qty\": 0, \"costo\": 0, \"vence\": \"YYYY-MM-DD o null\" }] }\n" +
  "Solo JSON, sin markdown ni explicaciones. Si un campo no es visible, usa null. qty y costo deben ser numeros.";

const detectFromUrl = (url: string) => {
  const u = (url || "").toLowerCase();
  if (u.includes("googleapis.com") || u.includes("generativelanguage")) return { format: "gemini", model: "gemini-2.0-flash" };
  if (u.includes("anthropic.com")) return { format: "claude", model: "claude-sonnet-4-20250514" };
  return { format: "openai", model: "gpt-4o" };
};

const parseApiError = (status: number, body: string, provider: string): string => {
  try {
    const j = JSON.parse(body);
    const msg = (j.error && (j.error.message || j.error.type)) || "";
    if (status === 429 || /quota|rate|high demand|overloaded/i.test(msg)) return provider + " esta saturado o sin cupo. Reintenta en un momento.";
    if (status === 401 || status === 403 || /auth|key/i.test(msg)) return "API Key de " + provider + " invalida. Revisala en Ajustes.";
    if (status === 400) return provider + " rechazo la solicitud.";
    if (msg) return provider + ": " + String(msg).slice(0, 150);
  } catch (_e) { /* ignore */ }
  if (status === 429 || status === 503) return provider + " esta saturado. Reintenta en un momento.";
  if (status === 401 || status === 403) return "API Key de " + provider + " invalida.";
  if (status >= 500) return "Servidor de " + provider + " no disponible.";
  return "Error de " + provider + " (" + status + ").";
};

// fetch con timeout (evita que la funcion se cuelgue esperando a un proveedor lento)
async function fetchTimeout(url: string, init: RequestInit, ms = 45000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);

  let payload: { base64?: string; mimeType?: string };
  try { payload = await req.json(); } catch { return json({ ok: false, error: "JSON invalido" }); }
  const base64 = payload.base64;
  const mimeType = payload.mimeType || "image/jpeg";
  if (!base64) return json({ ok: false, error: "Falta la imagen" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rows, error: cErr } = await supabase
    .from("configuracion").select("clave, valor")
    .in("clave", ["ia_api_key", "ia_format", "ia_model", "ia_url"]);
  if (cErr) return json({ ok: false, error: "No se pudo leer la configuracion: " + cErr.message });

  const cfg: Record<string, string> = {};
  for (const r of rows ?? []) cfg[r.clave] = r.valor;
  const apiKey = (cfg.ia_api_key || "").trim();
  if (!apiKey) return json({ ok: false, error: "Configura tu API Key de IA en Ajustes antes de usar el escaner." });

  const url = cfg.ia_url || "";
  const detected = detectFromUrl(url);
  const format = cfg.ia_format || detected.format;
  const model = cfg.ia_model || detected.model;
  const label = format;

  // Construir la peticion segun el proveedor
  let reqUrl: string;
  let reqInit: RequestInit;
  let extract: (j: any) => string | undefined;

  if (format === "claude") {
    reqUrl = url || "https://api.anthropic.com/v1/messages";
    reqInit = {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } }, { type: "text", text: PROMPT }] }] }),
    };
    extract = (j) => j.content && j.content[0] && j.content[0].text;
  } else if (format === "gemini") {
    const m = model || "gemini-2.0-flash";
    if (!url) {
      reqUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + apiKey;
    } else {
      let b = url.split("?")[0].replace(/\/+$/, "");
      if (!b.includes("/models/")) b += "/models/" + m + ":generateContent";
      else if (!b.includes(":generateContent")) b += ":generateContent";
      reqUrl = b + "?key=" + apiKey;
    }
    reqInit = {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: PROMPT }] }] }),
    };
    extract = (j) => j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
  } else {
    reqUrl = url || "https://api.openai.com/v1/chat/completions";
    reqInit = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + base64 } }, { type: "text", text: PROMPT }] }] }),
    };
    extract = (j) => j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  }

  // Llamar al proveedor con timeout + 1 reintento ante saturacion/cuelgue
  let text: string | undefined;
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchTimeout(reqUrl, reqInit, 45000);
      if (res.ok) { text = extract(await res.json()); break; }
      const body = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt === 1) { lastError = parseApiError(res.status, body, label); await sleep(1500); continue; }
      return json({ ok: false, error: parseApiError(res.status, body, label) });
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      lastError = aborted ? (label + " tardo demasiado (posible saturacion). Reintenta.") : ("Fallo al llamar la IA: " + (e instanceof Error ? e.message : String(e)));
      if (attempt === 1) { await sleep(1000); continue; }
      return json({ ok: false, error: lastError });
    }
  }

  if (!text) return json({ ok: false, error: lastError || "La IA no devolvio resultado." });
  const clean = String(text).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let resultado: unknown;
  try { resultado = JSON.parse(clean); } catch { return json({ ok: false, error: "La IA devolvio un formato invalido." }); }
  return json({ ok: true, resultado });
});
