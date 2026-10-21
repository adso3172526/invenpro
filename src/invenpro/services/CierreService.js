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
      // UPSERT por turno_id (constraint unica cierres_caja_turno_id_key): si un intento
      // anterior ya creo la fila del cierre (y el turno quedo abierto), reintentar la
      // ACTUALIZA en vez de fallar con "duplicate key". Hace el cierre idempotente.
      return this._upsert("cierres_caja", this._helpers.snakify(cierre), { onConflict: "turno_id" });
    }

    async getAll() {
      var data = await this._findAll("cierres_caja");
      return this._helpers.camelize(data);
    }
  }

  root.CierreService = CierreService;
  window.CierreService = CierreService;
})();
