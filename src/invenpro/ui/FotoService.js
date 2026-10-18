(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  // Normaliza la imagen a un WebP CUADRADO (800x800, foto completa centrada) y la sube al bucket 'productos'
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

  // Normaliza la imagen a un CUADRADO (lado x lado) con la foto centrada, COMPLETA
  // (sin recortar) y relleno transparente (se adapta al tema claro/oscuro). Asi la
  // foto queda uniforme y se ve igual y entera en Inventario, POS e Ingreso, sin
  // depender del object-fit del CSS (cover o contain dan el mismo resultado).
  function comprimirWebp(file, lado, calidad) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      var img = new Image();
      reader.onload = function () { img.src = reader.result; };
      reader.onerror = function () { reject(new Error("No se pudo leer la imagen.")); };
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = lado; canvas.height = lado;
        var ctx = canvas.getContext("2d");
        var escala = Math.min(lado / img.width, lado / img.height); // caber dentro (contain)
        var w = Math.max(1, Math.round(img.width * escala));
        var h = Math.max(1, Math.round(img.height * escala));
        ctx.drawImage(img, Math.round((lado - w) / 2), Math.round((lado - h) / 2), w, h);
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
