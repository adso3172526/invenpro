(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class CajeroController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
    }

    getCajeros() {
      var store = this._store;
      return (store && store.cajeros || []).map(function (c) { return Object.assign({}, c); });
    }

    getTurnos() {
      var store = this._store;
      return (store && store.turnos || []).map(function (t) { return Object.assign({}, t); });
    }

    getUsuariosSistema() {
      var store = this._store;
      return (store && store.usuarios_sistema || []).map(function (u) { return Object.assign({}, u); });
    }

    getUsuariosDisponibles(currentUser) {
      currentUser = currentUser || {};
      var cajeros = this.getCajeros();
      var usuarios = this.getUsuariosSistema();
      var esSupervisor = currentUser.rol === "Supervisor";

      return usuarios.filter(function (usuario) {
        if (cajeros.some(function (cajero) { return cajero.nombre === usuario.nombre; })) return false;
        if (esSupervisor && usuario.rol === "Administrador") return false;
        return true;
      });
    }
  }

  root.CajeroController = CajeroController;
  window.CajeroController = CajeroController;
})();
