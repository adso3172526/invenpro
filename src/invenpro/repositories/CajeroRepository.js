(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Cajero = root.Cajero || window.Cajero;
  var Helpers = root.Helpers || {};

  class CajeroRepository extends BaseRepository {
    constructor(db) {
      super("cajeros", "id", function (row) {
        return new Cajero(Helpers.camelize(row));
      }, db);
    }

    async findActivos() {
      var result = await this.getDb()
        .from(this.tableName).select("*").eq("estado", "activo");
      if (result.error) throw result.error;
      return (result.data || []).map(function (row) {
        return new Cajero(Helpers.camelize(row));
      });
    }
  }

  root.CajeroRepository = CajeroRepository;
  window.CajeroRepository = CajeroRepository;
})();
