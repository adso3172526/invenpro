(function () {
  const root = (window.InvenPro = window.InvenPro || {});

  class ServiceContainer {
    constructor() {
      this._services = new Map();
      this._factories = new Map();
    }

    register(name, service) {
      this._services.set(name, service);
      return this;
    }

    registerFactory(name, factory) {
      this._factories.set(name, factory);
      return this;
    }

    resolve(name) {
      if (this._services.has(name)) {
        return this._services.get(name);
      }
      if (this._factories.has(name)) {
        const service = this._factories.get(name)(this);
        this._services.set(name, service);
        return service;
      }
      throw new Error("Servicio no registrado: " + name);
    }

    has(name) {
      return this._services.has(name) || this._factories.has(name);
    }

    clear() {
      this._services.clear();
      this._factories.clear();
    }
  }

  root.ServiceContainer = ServiceContainer;
})();
