(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;

  class FacturaService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._productoService = deps && deps.productoService || null;
    }

    async create(factura, cartItems) {
      var error = await this._insert("facturas", {
        id: factura.id, fecha: factura.fecha, hora: factura.hora,
        cajero: factura.cajero, metodo: factura.metodo, total: factura.total,
      });
      if (error) return error;

      var rows = (cartItems || []).map(function (item) {
        return { factura_id: factura.id, sku: item.sku, nombre: item.nombre, q: item.q, precio: item.precio };
      });
      await this._insert("factura_items", rows);

      if (this._productoService) {
        for (var i = 0; i < (cartItems || []).length; i++) {
          await this._productoService.decrementStock(cartItems[i].sku, cartItems[i].q);
        }
      }
      return null;
    }
  }

  root.FacturaService = FacturaService;
  window.FacturaService = FacturaService;
})();
