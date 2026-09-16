(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Proveedor = root.Proveedor || window.Proveedor;
  var Helpers = root.Helpers || {};

  class ProveedorRepository extends BaseRepository {
    constructor(db) {
      super("proveedores", "id", function (row) {
        return new Proveedor(Helpers.camelize(row));
      }, db);
    }

    async findActivos() {
      var result = await this.getDb()
        .from(this.tableName).select("*").eq("estado", "activo");
      if (result.error) throw result.error;
      return (result.data || []).map(function (row) {
        return new Proveedor(Helpers.camelize(row));
      });
    }
  }

  root.ProveedorRepository = ProveedorRepository;
  window.ProveedorRepository = ProveedorRepository;
})();
