(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var Helpers = root.Helpers || {};

  class VencimientosController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
      this._eventBus = deps.eventBus || null;
      this._helpers = deps.helpers || Helpers;
    }

    _daysFromNow(dateStr) {
      return this._helpers.daysFromNow(dateStr);
    }

    getProductosVencibles() {
      var store = this._store;
      return (store && store.productos || []).filter(function (p) { return p.vence; });
    }

    buildBuckets(productos, umbrales) {
      umbrales = umbrales || { critico: 8, atencion: 15, preventivo: 30 };
      var self = this;
      var all = productos;
      return {
        vencido: all.filter(function (p) { return self._daysFromNow(p.vence) < 0; }),
        critico: all.filter(function (p) {
          var dias = self._daysFromNow(p.vence);
          return dias >= 0 && dias <= umbrales.critico;
        }),
        atencion: all.filter(function (p) {
          var dias = self._daysFromNow(p.vence);
          return dias > umbrales.critico && dias <= umbrales.atencion;
        }),
        preventivo: all.filter(function (p) {
          var dias = self._daysFromNow(p.vence);
          return dias > umbrales.atencion && dias <= umbrales.preventivo;
        }),
        ok: all.filter(function (p) { return self._daysFromNow(p.vence) > umbrales.preventivo; }),
      };
    }

    initConfig(dbKey, lsKey, def) {
      var store = this._store;
      var dbConfig = (store && store.configuracion) || {};
      try {
        if (dbConfig[dbKey]) return JSON.parse(dbConfig[dbKey]);
      } catch (e) { /* ignore */ }

      try {
        var value = JSON.parse(localStorage.getItem(lsKey));
        if (value) return value;
      } catch (e) { /* ignore */ }

      return def;
    }

    validEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  }

  root.VencimientosController = VencimientosController;
  window.VencimientosController = VencimientosController;
})();
