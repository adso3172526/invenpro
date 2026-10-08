(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class BaseService {
    constructor(db) {
      this._db = db || null;
    }

    getDb() {
      if (!this._db) {
        throw new Error("DataSource no inyectado en el servicio. Use setDb() o inyecte db en el constructor.");
      }
      return this._db;
    }

    setDb(db) {
      this._db = db;
    }

    async handleError(context, error) {
      if (error) {
        console.error("[" + context + "]", error);
        return error;
      }
      return null;
    }

    // --- Template methods for CRUD (OCP: subclasses use without rewriting) ---
    async _findAll(table) {
      var result = await this.getDb().from(table).select("*");
      if (result.error) throw result.error;
      return result.data || [];
    }

    async _findById(table, pk, id) {
      var result = await this.getDb()
        .from(table).select("*").eq(pk, id).maybeSingle();
      if (result.error) throw result.error;
      return result.data || null;
    }

    async _insert(table, data) {
      var result = await this.getDb().from(table).insert(data);
      return this.handleError(table + ".insert", result.error);
    }

    async _update(table, pk, id, data) {
      var result = await this.getDb().from(table).update(data).eq(pk, id);
      return this.handleError(table + ".update", result.error);
    }

    async _delete(table, pk, id) {
      var result = await this.getDb().from(table).delete().eq(pk, id);
      return this.handleError(table + ".delete", result.error);
    }

    async _rpc(fn, params) {
      var result = await this.getDb().rpc(fn, params);
      return this.handleError("rpc." + fn, result.error);
    }

    async _upsert(table, data, opts) {
      var result = await this.getDb().from(table).upsert(data, opts || {});
      return this.handleError(table + ".upsert", result.error);
    }
  }

  root.BaseService = BaseService;
  window.BaseService = BaseService;
})();
