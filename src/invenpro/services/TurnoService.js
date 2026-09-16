(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  class TurnoService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _snakify(obj) {
      return this._helpers.snakify(obj);
    }

    async create(turno) {
      return this._insert("turnos", this._snakify(turno));
    }

    async close(id, updates) {
      return this._update("turnos", "id", id, this._snakify(updates));
    }
  }

  root.TurnoService = TurnoService;
  window.TurnoService = TurnoService;
})();
