(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  // Cierres de caja (arqueo + desglose por medio de pago). Tabla: cierres_caja.
  class CierreService extends BaseService {
    constructor(db, deps) {
      super(db);
      this._helpers = (deps && deps.helpers) || Helpers;
    }

    async create(cierre) {
      return this._insert("cierres_caja", this._helpers.snakify(cierre));
    }

    async getAll() {
      var data = await this._findAll("cierres_caja");
      return this._helpers.camelize(data);
    }
  }

  root.CierreService = CierreService;
  window.CierreService = CierreService;
})();
