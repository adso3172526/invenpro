(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var Helpers = root.Helpers || {};

  class ShiftController {
    constructor(deps) {
      deps = deps || {};
      this._db = deps.db || null;
      this._turnoService = deps.turnoService || null;
      this._helpers = deps.helpers || Helpers;
    }

    _camelize(obj) {
      return this._helpers.camelize(obj);
    }

    async checkTurnoAbierto(cajeroNombre) {
      try {
        var db = this._db;
        if (!db) return null;
        var result = await db
          .from("turnos").select("*")
          .eq("cajero", cajeroNombre).eq("estado", "abierto")
          .limit(1);
        if (result.data && result.data.length) {
          return this._camelize(result.data[0]);
        }
        return null;
      } catch (error) {
        console.error("checkTurnoAbierto:", error);
        return null;
      }
    }

    async createTurno(cajerol, base, caja) {
      var now = new Date();
      var turnoId = "T-" + Date.now();
      var fechaIni = now.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

      var turnoRow = {
        id: turnoId,
        cajero: cajerol.nombre,
        fechaIni: fechaIni,
        fechaFin: null,
        estado: "abierto",
        baseIni: base,
        ventas: 0,
        transacciones: 0,
      };

      try {
        var svc = this._turnoService;
        if (!svc) return { ok: false, message: "TurnoService no inyectado" };
        await svc.create(turnoRow);
        return { ok: true, turno: Object.assign({}, turnoRow, { caja: caja, base: base, ini: now }) };
      } catch (error) {
        console.error("createTurno:", error);
        return { ok: false, message: error.message };
      }
    }

    getCurrentDateTime() {
      return new Date();
    }

    formatDateTime(date) {
      return date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
    }

    getAvailableBoxes() {
      return ["Caja 01", "Caja 02", "Caja 03"];
    }

    getDefaultBases() {
      return [100000, 150000, 200000, 250000, 300000];
    }
  }

  root.ShiftController = ShiftController;
  window.ShiftController = ShiftController;
})();
