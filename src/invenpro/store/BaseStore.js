(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class BaseStore {
    #db;
    #camelize;

    constructor(deps) {
      deps = deps || {};
      this.#db = deps.db || null;
      this.#camelize = deps.camelize || function (o) { return o; };
    }

    get db() { return this.#db; }
    setDb(db) { this.#db = db; }

    _camelize(obj) {
      return this.#camelize(obj);
    }

    async _queryWithTimeout(queryBuilder, tableName, timeoutMs) {
      timeoutMs = timeoutMs || 4000;
      return Promise.race([
        queryBuilder,
        new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error("timeout:" + tableName)); }, timeoutMs);
        }),
      ]).catch(function (error) {
        console.warn("[hydrate] " + tableName + ":", error && error.message || error);
        return { data: [] };
      });
    }

    _buildConfigMap(rows) {
      var map = {};
      (rows || []).forEach(function (r) { map[r.clave] = r.valor; });
      return map;
    }
  }

  root.BaseStore = BaseStore;
  window.BaseStore = BaseStore;
})();
