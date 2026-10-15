(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  // La API key de IA ya NO vive en el navegador. El escaner envia la imagen a la
  // Edge Function `analizar-ia`, que lee la key con service_role (server-side),
  // llama al proveedor (Gemini / OpenAI-compatibles / Claude) y devuelve el JSON.
  // Mantiene la misma firma: analizarConIA(base64, mimeType) -> objeto parseado.
  var analizarConIA = async function (base64, mimeType) {
    var resp = await window.db.functions.invoke("analizar-ia", {
      body: { base64: base64, mimeType: mimeType || "image/jpeg" },
    });
    var data = resp && resp.data;
    var error = resp && resp.error;
    if (error || !data || data.ok !== true) {
      throw new Error(
        (data && data.error) ||
        (error && error.message) ||
        "No se pudo analizar la imagen con IA."
      );
    }
    return data.resultado;
  };

  root.AiVisionService = { analizarConIA: analizarConIA };
  window.analizarConIA = analizarConIA;
})();
