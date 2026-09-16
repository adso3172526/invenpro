(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;

  class ConfigService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._store = deps && deps.store || null;
      this._eventBus = deps && deps.eventBus || null;
    }

    async save(clave, valor) {
      var value = String(valor || "");
      var error = await this._upsert("configuracion", { clave: clave, valor: value }, { onConflict: "clave" });
      if (this._store && this._store.configuracion) this._store.configuracion[clave] = value;
      if (this._eventBus) this._eventBus.emit("config:change", { clave: clave, valor: value });
      return error;
    }

    async saveBatch(entries) {
      var rows = Object.entries(entries).map(function (pair) {
        return { clave: pair[0], valor: String(pair[1] || "") };
      });
      var error = await this._upsert("configuracion", rows, { onConflict: "clave" });
      if (this._store && this._store.configuracion) {
        for (var i = 0; i < rows.length; i++) {
          this._store.configuracion[rows[i].clave] = rows[i].valor;
        }
      }
      if (this._eventBus) this._eventBus.emit("config:change", entries);
      return error;
    }
  }

  root.ConfigService = ConfigService;
  window.ConfigService = ConfigService;
})();
