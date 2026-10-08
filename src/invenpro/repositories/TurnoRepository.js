(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Turno = root.Turno || window.Turno;
  var Helpers = root.Helpers || {};

  class TurnoRepository extends BaseRepository {
    constructor(db) {
      super("turnos", "id", function (row) {
        return new Turno(Helpers.camelize(row));
      }, db);
    }

    async findAbiertosByCajero(cajeroNombre) {
      var result = await this.getDb()
        .from(this.tableName).select("*")
        .eq("cajero", cajeroNombre).eq("estado", "abierto")
        .limit(1);
      if (result.error) throw result.error;
      return result.data && result.data.length
        ? new Turno(Helpers.camelize(result.data[0]))
        : null;
    }
  }

  root.TurnoRepository = TurnoRepository;
  window.TurnoRepository = TurnoRepository;
})();
