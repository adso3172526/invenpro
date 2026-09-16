(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  class ProveedorService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _snakify(obj) {
      return this._helpers.snakify(obj);
    }

    async create(proveedor) {
      return this._insert("proveedores", this._snakify(proveedor));
    }

    async update(id, updates) {
      return this._update("proveedores", "id", id, this._snakify(updates));
    }
  }

  root.ProveedorService = ProveedorService;
  window.ProveedorService = ProveedorService;
})();
