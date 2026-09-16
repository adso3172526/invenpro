(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Producto = root.Producto || window.Producto;
  var Helpers = root.Helpers || {};

  class ProductoRepository extends BaseRepository {
    constructor(db) {
      super("productos", "sku", function (row) {
        return new Producto(Helpers.camelize(row));
      }, db);
    }

    async findBySku(sku) {
      return this.findById(sku);
    }

    async findByBarcode(codigoBarras) {
      var result = await this.getDb()
        .from(this.tableName).select("*").eq("codigo_barras", codigoBarras).maybeSingle();
      if (result.error) throw result.error;
      return result.data ? new Producto(Helpers.camelize(result.data)) : null;
    }

    async incrementStock(sku, qty) {
      var result = await this.getDb().rpc("increment_stock", { p_sku: sku, p_qty: qty });
      if (result.error) throw result.error;
      return true;
    }
  }

  root.ProductoRepository = ProductoRepository;
  window.ProductoRepository = ProductoRepository;
})();
