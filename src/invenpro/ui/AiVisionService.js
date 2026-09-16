(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var PROMPT = root.AiProviderConfig && root.AiProviderConfig.PROMPT_FACTURA;
  var parseErr = function (s, b, p) { return root.AiProviderConfig.parseApiError(s, b, p); };
  var analizarConIA = async function (base64, mimeType) {
    var cfg = (root.AiProviderConfig || window).getIAConfig(window.MOCK);
    if (!cfg.apiKey) throw new Error("Configura tu API Key en Ajustes antes de usar el escaner IA.");
    var label = cfg.name || cfg.id; var text;
    var controller = new AbortController();
    var tid = setTimeout(function () { controller.abort(); }, 60000);
    try {
      if (cfg.format === "claude") {
        var res = await fetch(cfg.url || "https://api.anthropic.com/v1/messages", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: cfg.model, max_tokens: 2048, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } }, { type: "text", text: PROMPT }] }] }),
        });
        if (!res.ok) { var err = await res.text(); throw new Error(parseErr(res.status, err, label)); }
        var json = await res.json(); text = json.content && json.content[0] && json.content[0].text;
      } else if (cfg.format === "gemini") {
        var buildUrl = function () {
          var model = cfg.model || "gemini-2.0-flash";
          if (!cfg.url) return "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + cfg.apiKey;
          var u = cfg.url.split("?")[0].replace(/\/+$/, "");
          if (!u.includes("/models/")) u += "/models/" + model + ":generateContent";
          else if (!u.includes(":generateContent")) u += ":generateContent";
          return u + "?key=" + cfg.apiKey;
        };
        var gres = await fetch(buildUrl(), {
          method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: mimeType, data: base64 } }, { text: PROMPT }] }] }),
        });
        if (!gres.ok) { var gerr = await gres.text(); throw new Error(parseErr(gres.status, gerr, label)); }
        var gjson = await gres.json(); text = gjson.candidates && gjson.candidates[0] && gjson.candidates[0].content && gjson.candidates[0].content.parts && gjson.candidates[0].content.parts[0] && gjson.candidates[0].content.parts[0].text;
      } else {
        var ores = await fetch(cfg.url || "https://api.openai.com/v1/chat/completions", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.apiKey },
          body: JSON.stringify({ model: cfg.model, messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + base64 } }, { type: "text", text: PROMPT }] }], max_tokens: 2048 }),
        });
        if (!ores.ok) { var oerr = await ores.text(); throw new Error(parseErr(ores.status, oerr, label)); }
        var ojson = await ores.json(); text = ojson.choices && ojson.choices[0] && ojson.choices[0].message && ojson.choices[0].message.content;
      }
    } catch (e) {
      if (e.name === "AbortError") throw new Error(label + " tardo demasiado (>60s).");
      throw e;
    } finally { clearTimeout(tid); }
    if (!text) throw new Error("La IA no devolvio resultado.");
    var clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try { return JSON.parse(clean); } catch (e) { throw new Error("La IA devolvio un formato invalido."); }
  };
  root.AiVisionService = { analizarConIA: analizarConIA };
  window.analizarConIA = analizarConIA;
})();
