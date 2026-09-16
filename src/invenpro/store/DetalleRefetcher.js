(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class DetalleRefetcher {
    constructor(deps) {
      deps = deps || {};
      this._db = deps.db || null;
      this._store = deps.store || null;
      this._eventBus = deps.eventBus || null;
      this._camelize = deps.camelize || function (o) { return o; };
      this._timers = {};
    }

    setDb(db) { this._db = db; }
    setStore(store) { this._store = store; }

    cancelAll() {
      for (var id in this._timers) clearTimeout(this._timers[id]);
      this._timers = {};
    }

    schedule(ingresoId) {
      if (this._timers[ingresoId]) clearTimeout(this._timers[ingresoId]);
      var self = this;
      this._timers[ingresoId] = setTimeout(async function () {
        delete self._timers[ingresoId];
        try {
          var db = self._db;
          if (!db) return;
          var result = await db.from("ingreso_detalle").select("*").eq("ingreso_id", ingresoId);
          if (result.error || !result.data) return;
          var store = self._store;
          if (!store) return;
          var ingresos = store.getIngresos ? store.getIngresos() : (store.ingresos || []);
          var ing = ingresos.find(function (x) { return x.id === ingresoId; });
          if (ing) {
            ing.detalle = self._camelize(result.data);
            if (store.updateIngreso) store.updateIngreso(ingresoId, ing);
            if (self._eventBus) self._eventBus.emit("realtime:ingresos", { type: "UPDATE", row: ing });
          }
        } catch (e) { console.error("[DetalleRefetcher] refetch:", e); }
      }, 800);
    }
  }

  root.DetalleRefetcher = DetalleRefetcher;
  window.DetalleRefetcher = DetalleRefetcher;
})();
