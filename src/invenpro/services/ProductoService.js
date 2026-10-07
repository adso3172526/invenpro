(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Producto = root.Producto || window.Producto;
  var Helpers = root.Helpers || {};

  class ProductoService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _camelize(obj) {
      return this._helpers.camelize(obj);
    }

    _snakify(obj) {
      return this._helpers.snakify(obj);
    }

    async getAll() {
      if (this.repo) return this.repo.findAll();
      var data = await this._findAll("productos");
      return this._camelize(data).map(function (d) { return new Producto(d); });
    }

    async create(producto) {
      var row = this._snakify({
        sku: producto.sku, nombre: producto.nombre, categoria: producto.categoria || "General",
        precio: producto.precio || 0, costo: producto.costo || 0, stock: producto.stock || 0,
        min: producto.min || 0, vence: producto.vence || null, unidad: producto.unidad || "und",
        codigo_barras: producto.codigoBarras || null,
      });
      return this._insert("productos", row);
    }

    async update(sku, updates) {
      return this._update("productos", "sku", sku, this._snakify(updates));
    }

    async updateBarcode(sku, codigoBarras) {
      return this._update("productos", "sku", sku, { codigo_barras: codigoBarras });
    }

    async incrementStock(sku, qty) {
      if (this.repo) return this.repo.incrementStock(sku, qty);
      return this._rpc("increment_stock", { p_sku: sku, p_qty: qty });
    }

    async decrementStock(sku, qty) {
      return this._rpc("decrement_stock", { p_sku: sku, p_qty: qty });
    }

    // Ajuste de precios por categoría vía la FUNCTION fn_ajustar_precios_categoria.
    // Devuelve { afectados, error } (afectados = nº de productos actualizados).
    // Se llama a getDb().rpc directo porque _rpc descarta el data (solo retorna error).
    async ajustarPreciosCategoria(categoria, porcentaje) {
      var result = await this.getDb().rpc("fn_ajustar_precios_categoria",
        { p_categoria: categoria, p_porcentaje: porcentaje });
      if (result.error) console.error("[ajustarPreciosCategoria]", result.error);
      return { afectados: result.data, error: result.error };
    }

    generateSku(productos) {
      var list = productos || [];
      var max = 0;
      for (var i = 0; i < list.length; i++) {
        var match = /^P-(\d+)$/.exec(list[i].sku || "");
        if (match) max = Math.max(max, Number(match[1]));
      }
      return "P-" + String(max + 1).padStart(5, "0");
    }
  }

  root.ProductoService = ProductoService;
  window.ProductoService = ProductoService;
})();
