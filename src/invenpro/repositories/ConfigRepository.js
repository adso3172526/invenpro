(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Helpers = root.Helpers || {};

  class ConfigRepository extends BaseRepository {
    constructor(db) {
      super("configuracion", "clave", function (row) {
        return Helpers.camelize(row);
      }, db);
    }

    async findAllAsMap() {
      var result = await this.getDb().from(this.tableName).select("*");
      if (result.error) throw result.error;
      var map = {};
      (result.data || []).forEach(function (row) {
        map[row.clave] = row.valor;
      });
      return map;
    }

    async upsert(clave, valor) {
      var result = await this.getDb()
        .from(this.tableName)
        .upsert({ clave: clave, valor: String(valor || "") }, { onConflict: "clave" });
      if (result.error) throw result.error;
      return true;
    }

    async upsertBatch(entries) {
      var rows = Object.entries(entries).map(function (pair) {
        return { clave: pair[0], valor: String(pair[1] || "") };
      });
      var result = await this.getDb()
        .from(this.tableName)
        .upsert(rows, { onConflict: "clave" });
      if (result.error) throw result.error;
      return true;
    }
  }

  root.ConfigRepository = ConfigRepository;
  window.ConfigRepository = ConfigRepository;
})();
