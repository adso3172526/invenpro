(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class AppController {
    constructor(deps) {
      deps = deps || {};
      this._authUseCase = deps.authUseCase || null;
      this._storage = deps.storage || window.localStorage;
    }

    readSession() {
      var key = "invenpro-session";
      try {
        var raw = this._storage.getItem(key);
        return raw ? JSON.parse(raw) : {};
      } catch (error) {
        return {};
      }
    }

    writeSession(patch) {
      patch = patch || {};
      var session = this.readSession();
      Object.assign(session, patch);
      this._storage.setItem("invenpro-session", JSON.stringify(session));
    }

    clearSession() {
      this._storage.removeItem("invenpro-session");
    }

    hasAdminAccess(user) {
      var permisos = (user && user.permisos) || [];
      return (user && user.rol === "Administrador")
        || (user && user.rol === "Supervisor")
        || permisos.includes("USUARIO_GESTIONAR")
        || permisos.includes("REPORTE_VER");
    }

    resolveStage(user) {
      if (!user) return "login";
      return this.hasAdminAccess(user) ? "admin" : "shift-open";
    }

    async login(usuario, pass) {
      if (!this._authUseCase) throw new Error("AuthUseCase no inyectado en AppController");
      return this._authUseCase.login(usuario, pass);
    }
  }

  root.AppController = AppController;
  window.AppController = AppController;
})();
