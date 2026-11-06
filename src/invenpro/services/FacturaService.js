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

      // Desglose por medio (pago mixto): 1 fila por medio con monto > 0
      var pagos = Array.isArray(factura.pagos) ? factura.pagos.filter(function (p) { return p && p.monto > 0; }) : [];
      if (pagos.length) {
        var pagoRows = pagos.map(function (p) {
          return { factura_id: factura.id, metodo: p.metodo, monto: p.monto };
        });
        await this._insert("factura_pagos", pagoRows);
      }

      if (this._productoService) {
        for (var i = 0; i < (cartItems || []).length; i++) {
          await this._productoService.decrementStock(cartItems[i].sku, cartItems[i].q);
        }
      }
      return null;
    }

    // Lee el detalle (items + pagos) de una factura directo de la BD. Se usa como
    // red de seguridad cuando la factura llegó por realtime sin el detalle anidado.
    async getDetalle(id) {
      var db = this.getDb();
      var cam = (root.Helpers && root.Helpers.camelize) || function (x) { return x; };
      var itemsRes = await db.from("factura_items").select("*").eq("factura_id", id);
      var pagosRes = await db.from("factura_pagos").select("*").eq("factura_id", id);
      return {
        items: (itemsRes && itemsRes.data) ? cam(itemsRes.data) : [],
        pagos: (pagosRes && pagosRes.data) ? cam(pagosRes.data) : [],
      };
    }
  }

  root.FacturaService = FacturaService;
  window.FacturaService = FacturaService;
})();
