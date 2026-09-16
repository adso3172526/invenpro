(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  class CajeroService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _snakify(obj) {
      return this._helpers.snakify(obj);
    }

    async update(id, updates) {
      return this._update("cajeros", "id", id, this._snakify(updates));
    }

    async updateUsuario(usuario, updates) {
      return this._update("usuarios_sistema", "usuario", usuario, updates);
    }
  }

  root.CajeroService = CajeroService;
  window.CajeroService = CajeroService;
})();
