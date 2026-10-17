(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  // Comprime una imagen a WebP (lado máx 800px) y la sube al bucket 'productos'
  // como "<sku>.webp" (upsert: reemplaza la anterior sin dejar basura). Devuelve
  // la URL pública con cache-buster para que el reemplazo se vea al instante.
  async function subirFotoProducto(file, sku) {
    if (!file) throw new Error("No hay archivo.");
    if (!sku) throw new Error("El producto necesita SKU antes de subir la foto.");
    var blob = await comprimirWebp(file, 800, 0.8);
    var path = String(sku) + ".webp";
    var up = await window.db.storage.from("productos").upload(path, blob, {
      upsert: true,
      contentType: "image/webp",
    });
    if (up.error) throw up.error;
    var pub = window.db.storage.from("productos").getPublicUrl(path);
    var url = pub && pub.data && pub.data.publicUrl;
    if (!url) throw new Error("No se pudo obtener la URL de la foto.");
    return url + "?v=" + Date.now();
  }

  // file -> Blob WebP redimensionado (mantiene proporción).
  function comprimirWebp(file, maxLado, calidad) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      var img = new Image();
      reader.onload = function () { img.src = reader.result; };
      reader.onerror = function () { reject(new Error("No se pudo leer la imagen.")); };
      img.onload = function () {
        var w = img.width, h = img.height;
        var escala = Math.min(1, maxLado / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * escala));
        var ch = Math.max(1, Math.round(h * escala));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("No se pudo comprimir la imagen."));
        }, "image/webp", calidad);
      };
      img.onerror = function () { reject(new Error("Imagen inválida.")); };
      reader.readAsDataURL(file);
    });
  }

  root.FotoService = { subirFotoProducto: subirFotoProducto };
  window.subirFotoProducto = subirFotoProducto;
})();
