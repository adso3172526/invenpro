(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Factura = root.Factura || window.Factura;
  var Helpers = root.Helpers || {};

  class FacturaRepository extends BaseRepository {
    constructor(db) {
      super("facturas", "id", function (row) {
        var raw = Helpers.camelize(row);
        raw.items = raw.facturaItems || [];
        delete raw.facturaItems;
        return new Factura(raw);
      }, db);
    }

    async findAllWithItems() {
      var result = await this.getDb()
        .from(this.tableName).select("*, factura_items(*)");
      if (result.error) throw result.error;
      return (result.data || []).map(this.mapper)
        .sort(function (a, b) {
          return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
        });
    }
  }

  root.FacturaRepository = FacturaRepository;
  window.FacturaRepository = FacturaRepository;
})();
