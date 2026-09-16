(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var IRealtimeHandler = root.IRealtimeHandler || window.IRealtimeHandler;

  var KEY_MAP = {
    productos: { pk: "sku", add: "addProducto", remove: "removeProducto", update: "updateProducto" },
    cajeros: { pk: "id", remove: "removeCajero", update: "updateCajero" },
    usuarios_sistema: { pk: "usuario", remove: "removeUsuario", update: "updateUsuario" },
    proveedores: { pk: "id", remove: "removeProveedor", update: "updateProveedor" },
    turnos: { pk: "id", remove: "removeTurno", update: "updateTurno" },
    facturas: { pk: "id", add: "addFactura", remove: "removeFactura", update: "updateFactura", sort: "sortFacturas" },
    ingresos: { pk: "id", add: "addIngreso", remove: "removeIngreso", update: "updateIngreso" },
    configuracion: { pk: "clave" },
  };

  class GenericHandler extends IRealtimeHandler {
    constructor(store, eventBus, opts) {
      super(store, eventBus);
      this.key = opts.key;
      this.EntityClass = opts.EntityClass;
      this.primaryKey = opts.primaryKey || "id";
      this._config = KEY_MAP[opts.key] || { pk: opts.primaryKey || "id" };
    }

    handleInsert(row) {
      var store = this.store;
      if (!store) return;

      if (this.key === "configuracion") {
        var r = row || {};
        if (r.clave != null && typeof store.setConfigValue === "function") {
          store.setConfigValue(r.clave, r.valor);
        }
        if (this.eventBus) this.eventBus.emit("realtime:configuracion", { type: "INSERT", row: r });
        return;
      }

      var pk = this._config.pk;
      var entity = this.EntityClass ? new this.EntityClass(row) : row;

      if (this._config.add && typeof store[this._config.add] === "function") {
        store[this._config.add](entity);
      }

      if (this._config.sort && typeof store[this._config.sort] === "function") {
        store[this._config.sort]();
      }

      if (this.eventBus) this.eventBus.emit("realtime:" + this.key, { type: "INSERT", row: row });
    }

    handleUpdate(row) {
      var store = this.store;
      if (!store) return;

      if (this.key === "configuracion") {
        var r = row || {};
        if (r.clave != null && typeof store.setConfigValue === "function") {
          store.setConfigValue(r.clave, r.valor);
        }
        if (this.eventBus) this.eventBus.emit("realtime:configuracion", { type: "UPDATE", row: r });
        return;
      }

      var pk = this._config.pk;
      var entity = this.EntityClass ? new this.EntityClass(row) : row;

      if (this._config.update && typeof store[this._config.update] === "function") {
        store[this._config.update](row[pk], entity);
      }

      if (this._config.sort && typeof store[this._config.sort] === "function") {
        store[this._config.sort]();
      }

      if (this.eventBus) this.eventBus.emit("realtime:" + this.key, { type: "UPDATE", row: row });
    }

    handleDelete(oldRow) {
      var store = this.store;
      if (!store) return;

      if (this.key === "configuracion") return;

      var pk = this._config.pk;
      var id = oldRow[pk];

      if (this._config.remove && typeof store[this._config.remove] === "function") {
        store[this._config.remove](id);
      }

      if (this.eventBus) this.eventBus.emit("realtime:" + this.key, { type: "DELETE", row: oldRow });
    }
  }

  root.GenericHandler = GenericHandler;
  window.GenericHandler = GenericHandler;
})();
