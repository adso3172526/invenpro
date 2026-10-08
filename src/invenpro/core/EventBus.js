(function () {
  const root = (window.InvenPro = window.InvenPro || {});

  class EventBus {
    constructor() {
      this._listeners = new Map();
    }

    on(event, callback) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event).push(callback);
      return () => this.off(event, callback);
    }

    off(event, callback) {
      const list = this._listeners.get(event);
      if (list) {
        this._listeners.set(event, list.filter((fn) => fn !== callback));
      }
    }

    emit(event, payload) {
      const list = this._listeners.get(event) || [];
      for (const callback of list) {
        try {
          callback(payload);
        } catch (error) {
          console.error("[EventBus]", event, error);
        }
      }
    }

    clear() {
      this._listeners.clear();
    }
  }

  root.EventBus = EventBus;
  window.EventBus = EventBus;
})();
