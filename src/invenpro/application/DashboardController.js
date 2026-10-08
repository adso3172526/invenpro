(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class DashboardController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
    }

    getVentasHoy() {
      var store = this._store;
      return (store && store.ventasHoy || []).map(function (e) { return Object.assign({}, e); });
    }

    getVentasCajeroHoy() {
      var store = this._store;
      return (store && store.ventasCajero || []).map(function (e) { return Object.assign({}, e); });
    }

    getKpis() {
      var ventasHoy = this.getVentasHoy();
      var totalHoy = ventasHoy.reduce(function (sum, item) { return sum + (item.v || 0); }, 0);
      var maxHora = Math.max.apply(null, ventasHoy.map(function (item) { return item.v || 0; }).concat([0]));
      var horaPico = ventasHoy.find(function (item) { return (item.v || 0) === maxHora; }) || { h: "00", v: 0 };

      return {
        totalHoy: totalHoy,
        maxHora: maxHora,
        horaPico: horaPico,
        sparkData: ventasHoy.map(function (item) { return item.v; }),
        ventasCajeroHoy: this.getVentasCajeroHoy().map(function (cajero) {
          return Object.assign({}, cajero, {
            hoy: Math.round((cajero.total || 0) / 30 * (0.6 + Math.random() * 0.8)),
          });
        }),
      };
    }
  }

  root.DashboardController = DashboardController;
  window.DashboardController = DashboardController;
})();
