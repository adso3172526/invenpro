(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  var REALTIME_TABLES = [
    "productos", "cajeros", "usuarios_sistema", "proveedores",
    "turnos", "facturas", "factura_items", "ingresos", "ingreso_detalle", "configuracion",
  ];

  class RealtimeManager {
    constructor(deps) {
      deps = deps || {};
      this._db = deps.db || null;
      this._store = deps.store || null;
      this._eventBus = deps.eventBus || null;
      this._viewRefresher = deps.viewRefresher || null;
      this._detalleRefetcher = deps.detalleRefetcher || null;
      this._tables = deps.tables || REALTIME_TABLES;
      this._channel = null;
      this._started = false;
      this._everSubscribed = false;
      this._needResync = false;
      this._handlers = new Map();
    }

    registerHandler(table, handler) {
      this._handlers.set(table, handler);
      return this;
    }

    start() {
      if (this._started) return;
      var db = this._db;
      if (!db) return;
      this._started = true;

      var self = this;
      var channel = db.channel("invenpro-realtime");

      for (var i = 0; i < this._tables.length; i++) {
        (function (table) {
          channel.on("postgres_changes", { event: "*", schema: "public", table: table }, function (payload) {
            self._dispatch(table, payload);
          });
        })(this._tables[i]);
      }

      channel.subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          if (self._needResync) { self._needResync = false; self._resync(); }
          self._everSubscribed = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (self._everSubscribed && self._started) {
            self._needResync = true;
          }
        }
      });

      this._channel = channel;
    }

    stop() {
      if (this._channel && this._db) {
        this._db.removeChannel(this._channel);
        this._channel = null;
      }
      if (this._viewRefresher) this._viewRefresher.cancel();
      if (this._detalleRefetcher) this._detalleRefetcher.cancelAll();
      this._started = false;
      this._everSubscribed = false;
      this._needResync = false;
    }

    _dispatch(table, payload) {
      var handler = this._handlers.get(table);
      if (handler) {
        handler.dispatch(payload);
      }

      if ((table === "productos" || table === "factura_items") && this._viewRefresher) {
        this._viewRefresher.schedule();
      }
      if (table === "ingresos" && payload.eventType === "UPDATE" && payload.new && payload.new.id && this._detalleRefetcher) {
        this._detalleRefetcher.schedule(payload.new.id);
      }
    }

    async _resync() {
      var store = this._store;
      if (!store) return;
      try {
        await store.hydrate();
        var tables = ["productos", "cajeros", "usuarios_sistema", "proveedores", "turnos",
          "facturas", "ingresos", "configuracion", "views"];
        var bus = this._eventBus;
        if (bus) {
          for (var i = 0; i < tables.length; i++) {
            bus.emit("realtime:" + tables[i], { type: "RESYNC" });
          }
        }
      } catch (e) {
        console.error("[RealtimeManager] resync:", e);
        this._needResync = true;
      }
    }

    setDb(db) { this._db = db; }
    setStore(store) { this._store = store; }
  }

  root.RealtimeManager = RealtimeManager;
  window.RealtimeManager = RealtimeManager;
})();
