(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class ProveedorController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
      this._proveedorService = deps.proveedorService || null;
    }

    getProviders() {
      var store = this._store;
      return (store && store.proveedores || []).map(function (p) { return Object.assign({}, p); });
    }

    computeStats(proveedores) {
      var activos = proveedores.filter(function (p) { return p.estado === "activo"; }).length;
      return { total: proveedores.length, activos: activos, inactivos: proveedores.length - activos };
    }

    filterProviders(proveedores, opts) {
      opts = opts || {};
      var q = opts.q || "";
      var estado = opts.estado || "Todos";
      var categoria = opts.categoria || "Todas";
      var list = proveedores;

      if (estado !== "Todos") {
        list = list.filter(function (p) { return p.estado === estado; });
      }
      if (categoria !== "Todas") {
        list = list.filter(function (p) { return p.categoria === categoria; });
      }
      if (q) {
        var query = q.toLowerCase();
        list = list.filter(function (p) {
          return (p.nombre || "").toLowerCase().includes(query) ||
            (p.nit || "").toLowerCase().includes(query) ||
            (p.contacto || "").toLowerCase().includes(query) ||
            (p.email || "").toLowerCase().includes(query);
        });
      }
      return list.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
    }

    async saveProvider(data) {
      var svc = this._proveedorService;
      if (!svc) return { ok: false, message: "ProveedorService no inyectado" };

      if (data.id) {
        var error = await svc.update(data.id, data);
        if (error) return { ok: false, message: "Error al guardar: " + (error.message || "Intenta de nuevo") };
        return { ok: true, message: "Proveedor actualizado" };
      }

      var store = this._store;
      var nextId = "PRV-" + String((store && store.proveedores || []).length + 1).padStart(3, "0");
      var nuevo = Object.assign({}, data, {
        id: nextId, ingresos: 0, ultimoIngreso: null, estado: "activo",
      });

      var error = await svc.create(nuevo);
      if (error) return { ok: false, message: "Error al crear: " + (error.message || "Intenta de nuevo") };
      return { ok: true, message: "Proveedor creado", value: nuevo };
    }

    async toggleStatus(proveedor) {
      var svc = this._proveedorService;
      if (!svc) return { ok: false, message: "ProveedorService no inyectado" };

      var nuevoEstado = proveedor.estado === "activo" ? "inactivo" : "activo";
      var error = await svc.update(proveedor.id, { estado: nuevoEstado });
      if (error) {
        return { ok: false, message: "No se pudo cambiar el estado: " + (error.message || "Intenta de nuevo") };
      }
      return {
        ok: true,
        message: nuevoEstado === "activo" ? "Proveedor reactivado" : "Proveedor dado de baja",
        value: nuevoEstado,
      };
    }
  }

  root.ProveedorController = ProveedorController;
  window.ProveedorController = ProveedorController;
})();
