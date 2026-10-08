(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class ReportesController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
    }

    getFacturas() {
      var store = this._store;
      return (store && store.facturas || []).map(function (f) {
        return Object.assign({}, f, {
          items: (f.items || []).map(function (item) { return Object.assign({}, item); }),
        });
      });
    }

    filterFacturas(opts) {
      opts = opts || {};
      var filtroMes = opts.filtroMes || "Todos";
      var filtroCajero = opts.filtroCajero || "Todos";
      var filtroProducto = opts.filtroProducto || "Todos";
      var filtroMetodo = opts.filtroMetodo || "Todos";
      var facturas = this.getFacturas();

      return facturas.filter(function (f) {
        if (filtroMes !== "Todos" && !f.fecha.startsWith(filtroMes)) return false;
        if (filtroCajero !== "Todos" && f.cajero !== filtroCajero) return false;
        if (filtroMetodo !== "Todos" && f.metodo !== filtroMetodo) return false;
        if (filtroProducto !== "Todos" && !f.items.some(function (item) { return item.nombre === filtroProducto; })) return false;
        return true;
      });
    }

    getByMonth(filtered) {
      var map = {};
      filtered.forEach(function (f) {
        var key = f.fecha.slice(0, 7);
        map[key] = (map[key] || 0) + f.total;
      });
      return Object.entries(map).sort().map(function (pair) { return { mes: pair[0], total: pair[1] }; });
    }

    getByCajero(filtered) {
      var map = {};
      filtered.forEach(function (f) {
        map[f.cajero] = (map[f.cajero] || 0) + f.total;
      });
      return Object.entries(map)
        .sort(function (a, b) { return b[1] - a[1]; })
        .map(function (pair) { return { nombre: pair[0], total: pair[1] }; });
    }

    getByMetodo(filtered) {
      var map = {};
      filtered.forEach(function (f) {
        map[f.metodo] = (map[f.metodo] || 0) + f.total;
      });
      var sum = Object.values(map).reduce(function (t, v) { return t + v; }, 0) || 1;
      return Object.entries(map)
        .sort(function (a, b) { return a[1] - b[1]; })
        .map(function (pair) { return { nombre: pair[0], total: pair[1], pct: (pair[1] / sum) * 100 }; });
    }

    getTopProductos(filtered) {
      var map = {};
      filtered.forEach(function (f) {
        f.items.forEach(function (item) {
          if (!map[item.nombre]) map[item.nombre] = { nombre: item.nombre, qty: 0, total: 0 };
          map[item.nombre].qty += item.q;
          map[item.nombre].total += item.q * item.precio;
        });
      });
      return Object.values(map)
        .sort(function (a, b) { return b.qty - a.qty; })
        .slice(0, 5);
    }

    computeSummary(filtered) {
      var totalFiltro = filtered.reduce(function (sum, f) { return sum + f.total; }, 0);
      var tickets = filtered.length;
      var promedio = tickets ? totalFiltro / tickets : 0;
      var unidades = filtered.reduce(function (sum, f) {
        return sum + f.items.reduce(function (acc, item) { return acc + item.q; }, 0);
      }, 0);
      return { totalFiltro: totalFiltro, tickets: tickets, promedio: promedio, unidades: unidades };
    }
  }

  root.ReportesController = ReportesController;
  window.ReportesController = ReportesController;
})();
