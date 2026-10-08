(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class RepositoryFactory {
    constructor(deps) {
      deps = deps || {};
      this._db = deps.db || null;
      this._repos = new Map();
      this._registry = new Map();
    }

    register(name, factory) {
      this._registry.set(name, factory);
      return this;
    }

    registerClass(name, RepoClass) {
      var db = this._db;
      this._registry.set(name, function () { return new RepoClass(db); });
      return this;
    }

    get(name) {
      if (!this._repos.has(name)) {
        var factory = this._registry.get(name);
        if (!factory) throw new Error("Repositorio no registrado: " + name);
        this._repos.set(name, factory());
      }
      return this._repos.get(name);
    }

    has(name) {
      return this._registry.has(name);
    }

    setDb(db) {
      this._db = db;
      this._repos.clear();
    }
  }

  root.RepositoryFactory = RepositoryFactory;
  window.RepositoryFactory = RepositoryFactory;
})();
