(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;

  class IngresoService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
    }

    async create(ingreso, detalle) {
      var error = await this._insert("ingresos", {
        id: ingreso.id, fecha: ingreso.fecha, proveedor: ingreso.proveedor,
        items: ingreso.items, costo: ingreso.costo, recibe: ingreso.recibe, factura: ingreso.factura,
      });
      if (error) return error;

      var rows = (detalle || []).map(function (item) {
        return { ingreso_id: ingreso.id, sku: item.sku, nombre: item.nombre, qty: item.qty,
          costo: item.costo, vence: item.vence || null, nota: item.nota || null };
      });
      return this._insert("ingreso_detalle", rows);
    }

    async update(id, header, detalle) {
      var error = await this._update("ingresos", "id", id, {
        proveedor: header.proveedor, factura: header.factura, recibe: header.recibe,
      });
      if (error) return error;

      await this._delete("ingreso_detalle", "ingreso_id", id);

      var rows = (detalle || []).map(function (item) {
        return { ingreso_id: id, sku: item.sku, nombre: item.nombre, qty: item.qty,
          costo: item.costo, vence: item.vence || null, nota: item.nota || null };
      });
      error = await this._insert("ingreso_detalle", rows);
      if (error) return error;

      var totalCosto = (detalle || []).reduce(function (sum, item) {
        return sum + Number(item.qty || 0) * Number(item.costo || 0);
      }, 0);
      await this._update("ingresos", "id", id, { items: (detalle || []).length, costo: totalCosto });
      return null;
    }
  }

  root.IngresoService = IngresoService;
  window.IngresoService = IngresoService;
})();
