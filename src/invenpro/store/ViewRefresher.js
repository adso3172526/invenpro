(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  var VIEW_SETTERS = {
    ventas_mes: "setVentasMes",
    ventas_cajero: "setVentasCajero",
    top_productos: "setTopProductos",
    ventas_hoy: "setVentasHoy",
  };

  class ViewRefresher {
    constructor(deps) {
      deps = deps || {};
      this._db = deps.db || null;
      this._store = deps.store || null;
      this._eventBus = deps.eventBus || null;
      this._camelize = deps.camelize || function (o) { return o; };
      this._timer = null;
      this._views = deps.views || ["ventas_mes", "ventas_cajero", "top_productos", "ventas_hoy"];
    }

    setDb(db) { this._db = db; }
    setStore(store) { this._store = store; }

    schedule() {
      if (this._timer) clearTimeout(this._timer);
      var self = this;
      this._timer = setTimeout(function () { self.refresh(); }, 2000);
    }

    cancel() {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    }

    async refresh() {
      var db = this._db;
      var store = this._store;
      if (!db || !store) return;
      try {
        var promises = this._views.map(function (view) {
          return db.from(view).select("*");
        });
        var results = await Promise.all(promises);
        var camelize = this._camelize;

        for (var i = 0; i < this._views.length; i++) {
          var viewName = this._views[i];
          var setterName = VIEW_SETTERS[viewName];
          if (setterName && typeof store[setterName] === "function") {
            store[setterName](camelize(results[i] && results[i].data || []));
          }
        }

        if (this._eventBus) this._eventBus.emit("realtime:views", {});
      } catch (e) {
        console.error("[ViewRefresher] refresh:", e);
      }
    }
  }

  root.ViewRefresher = ViewRefresher;
  window.ViewRefresher = ViewRefresher;
})();
