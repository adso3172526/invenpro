(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class InventoryController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
      this._productoService = deps.productoService || null;
    }

    getProducts() {
      var store = this._store;
      return (store && store.productos || []).map(function (p) { return Object.assign({}, p); });
    }

    computeStats(productos) {
      var sinCodigo = productos.filter(function (p) { return !p.codigoBarras; }).length;
      var bajo = productos.filter(function (p) { return p.stock < p.min; }).length;
      var totalValor = productos.reduce(function (sum, p) { return sum + p.stock * p.costo; }, 0);
      var totalStock = productos.reduce(function (sum, p) { return sum + p.stock; }, 0);
      return { sinCodigo: sinCodigo, bajo: bajo, totalValor: totalValor, totalStock: totalStock };
    }

    filterProducts(productos, opts) {
      opts = opts || {};
      var q = opts.q || "";
      var cat = opts.cat || "Todos";
      var estado = opts.estado || "Todos";
      var list = productos;

      if (cat !== "Todos") {
        list = list.filter(function (p) { return p.categoria === cat; });
      }

      if (q) {
        var query = q.toLowerCase().trim();
        list = list.filter(function (p) {
          return p.nombre.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            (p.codigoBarras && p.codigoBarras.toLowerCase().includes(query));
        });
      }

      if (estado === "Bajo") {
        list = list.filter(function (p) { return p.stock < p.min; });
      } else if (estado === "Sin stock") {
        list = list.filter(function (p) { return p.stock === 0; });
      } else if (estado === "Sin código") {
        list = list.filter(function (p) { return !p.codigoBarras; });
      } else if (estado === "Con código") {
        list = list.filter(function (p) { return !!p.codigoBarras; });
      }

      return list.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
    }

    async assignBarcode(opts) {
      var sanitized = (opts.codigo || "").trim();
      if (!sanitized) {
        return { ok: false, message: "Escanea o digita un código de barras" };
      }

      var existente = opts.productos.find(function (p) {
        return p.codigoBarras === sanitized && p.sku !== opts.sku;
      });
      if (existente) {
        return {
          ok: false,
          message: "Este código ya está asignado a \"" + existente.nombre + "\" (" + existente.sku + ")",
        };
      }

      var svc = this._productoService;
      if (!svc) return { ok: false, message: "ProductoService no inyectado" };

      var error = await svc.updateBarcode(opts.sku, sanitized);
      if (error) {
        return { ok: false, message: "Error al guardar: " + (error.message || "Intenta de nuevo") };
      }
      return { ok: true, message: "Código de barras asignado correctamente", value: sanitized };
    }

    async saveProduct(draft) {
      var productos = this.getProducts();
      if (draft.codigoBarras) {
        var duplicado = productos.find(function (p) {
          return p.codigoBarras === draft.codigoBarras && p.sku !== draft.sku;
        });
        if (duplicado) {
          return { ok: false, message: "Código de barras ya asignado a \"" + duplicado.nombre + "\"" };
        }
      }

      var svc = this._productoService;
      if (!svc) return { ok: false, message: "ProductoService no inyectado" };

      var error = await svc.update(draft.sku, {
        nombre: draft.nombre,
        categoria: draft.categoria,
        precio: draft.precio,
        costo: draft.costo,
        stock: draft.stock,
        min: draft.min,
        unidad: draft.unidad,
        vence: draft.vence || null,
        codigoBarras: draft.codigoBarras || null,
      });

      if (error) {
        return { ok: false, message: "Error al guardar: " + (error.message || "Intenta de nuevo") };
      }
      return { ok: true, message: "Producto actualizado" };
    }
  }

  root.InventoryController = InventoryController;
  window.InventoryController = InventoryController;
})();
