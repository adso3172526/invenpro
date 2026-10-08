(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Ingreso = root.Ingreso || window.Ingreso;
  var Helpers = root.Helpers || {};

  class IngresoRepository extends BaseRepository {
    constructor(db) {
      super("ingresos", "id", function (row) {
        var raw = Helpers.camelize(row);
        raw.detalle = raw.ingresoDetalle || [];
        delete raw.ingresoDetalle;
        return new Ingreso(raw);
      }, db);
    }

    async findAllWithDetalle() {
      var result = await this.getDb()
        .from(this.tableName).select("*, ingreso_detalle(*)");
      if (result.error) throw result.error;
      return (result.data || []).map(this.mapper);
    }

    async findDetalleByIngresoId(ingresoId) {
      var result = await this.getDb()
        .from("ingreso_detalle").select("*").eq("ingreso_id", ingresoId);
      if (result.error) throw result.error;
      return Helpers.camelize(result.data || []);
    }

    async deleteDetalleByIngresoId(ingresoId) {
      var result = await this.getDb()
        .from("ingreso_detalle").delete().eq("ingreso_id", ingresoId);
      if (result.error) throw result.error;
      return true;
    }

    async insertDetalle(rows) {
      var result = await this.getDb().from("ingreso_detalle").insert(rows);
      if (result.error) throw result.error;
      return true;
    }
  }

  root.IngresoRepository = IngresoRepository;
  window.IngresoRepository = IngresoRepository;
})();
