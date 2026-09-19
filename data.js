// InvenPro — Thin shim (delegates to src/invenpro/ SOLID layer)
// Loads AFTER src/invenpro/*.js (which defines all classes via window.InvenPro)
// This file is the ONLY place that creates window.MOCK, window.DB, window.EventBus
// and wires all dependencies together via DI.
(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var Helpers = root.Helpers || {};
  var db = window.db;

  // ---- Helpers: expose to window for JSX backward compat ----
  window.camelize = Helpers.camelize;
  window.snakify = Helpers.snakify;
  window.hashPass = Helpers.hashPass;
  window.md5Hex = Helpers.md5Hex;
  window.fmtCOP = Helpers.fmtCOP;
  window.daysFromNow = Helpers.daysFromNow;
  window.todayStr = Helpers.todayStr;

  // ---- Domain classes: expose to window for JSX backward compat ----
  var Proto = root.Producto || window.Producto;
  var Usua  = root.Usuario  || window.Usuario;
  var Caj   = root.Cajero   || window.Cajero;
  var Prov  = root.Proveedor|| window.Proveedor;
  var Tur   = root.Turno    || window.Turno;
  var Fac   = root.Factura  || window.Factura;
  var Ing   = root.Ingreso  || window.Ingreso;

  window.Producto   = Proto;
  window.Usuario    = Usua;
  window.Cajero     = Caj;
  window.Proveedor  = Prov;
  window.Turno      = Tur;
  window.Factura    = Fac;
  window.Ingreso    = Ing;

  // ---- EventBus ----
  var _bus = new (root.EventBus || window.EventBus)();
  window.EventBus = _bus;

  // ---- DataStore (with DI) ----
  var DS = root.DataStore || window.DataStore;
  window._dataStore = new DS({
    db: db,
    entityClasses: { Producto: Proto, Usuario: Usua, Cajero: Caj, Proveedor: Prov, Turno: Tur, Factura: Fac },
    camelize: Helpers.camelize,
  });
  window.MOCK = window._dataStore;

  // ---- Repositories (with DI) ----
  var productoRepo = new (root.ProductoRepository || window.ProductoRepository)(db);
  var usuarioRepo = new (root.UsuarioRepository || window.UsuarioRepository)(db);
  var cajeroRepo = new (root.CajeroRepository || window.CajeroRepository)(db);
  var proveedorRepo = new (root.ProveedorRepository || window.ProveedorRepository)(db);
  var turnoRepo = new (root.TurnoRepository || window.TurnoRepository)(db);
  var facturaRepo = new (root.FacturaRepository || window.FacturaRepository)(db);
  var ingresoRepo = new (root.IngresoRepository || window.IngresoRepository)(db);
  var configRepo = new (root.ConfigRepository || window.ConfigRepository)(db);

  // ---- Services (with DI — repos injected) ----
  var authService = new (root.AuthService || window.AuthService)(db, { helpers: Helpers, repo: usuarioRepo });
  var productoService = new (root.ProductoService || window.ProductoService)(db, { helpers: Helpers, repo: productoRepo });
  var facturaService = new (root.FacturaService || window.FacturaService)(db, { productoService: productoService, repo: facturaRepo });
  var turnoService = new (root.TurnoService || window.TurnoService)(db, { helpers: Helpers, repo: turnoRepo });
  var cajeroService = new (root.CajeroService || window.CajeroService)(db, { helpers: Helpers, repo: cajeroRepo });
  var proveedorService = new (root.ProveedorService || window.ProveedorService)(db, { helpers: Helpers, repo: proveedorRepo });
  var ingresoService = new (root.IngresoService || window.IngresoService)(db, { repo: ingresoRepo });
  var configService = new (root.ConfigService || window.ConfigService)(db, { store: window.MOCK, eventBus: _bus, repo: configRepo });

  // ---- window.DB service layer (with DI) ----
  window.DB = {
    auth: authService,
    productos: productoService,
    facturas: facturaService,
    turnos: turnoService,
    cajeros: cajeroService,
    proveedores: proveedorService,
    ingresos: ingresoService,
    config: configService,
  };

  // ---- Use Cases + Controllers (with DI — no window.DB fallback) ----
  var authUseCase = new (root.AuthUseCase || window.AuthUseCase)(authService);
  var inventoryUseCase = new (root.InventoryUseCase || window.InventoryUseCase)(productoService);

  var appController = new (root.AppController || window.AppController)({ authUseCase: authUseCase });
  window.AppController = appController;
  window.appController = appController;

  // ---- RealtimeManager + ViewRefresher + DetalleRefetcher (with DI) ----
  var RealtimeMgr = root.RealtimeManager || window.RealtimeManager;
  var ViewRefresherCls = root.ViewRefresher || window.ViewRefresher;
  var DetalleRefetcherCls = root.DetalleRefetcher || window.DetalleRefetcher;

  var _viewRefresher = new ViewRefresherCls({ db: db, store: window.MOCK, eventBus: _bus, camelize: Helpers.camelize });
  var _detalleRefetcher = new DetalleRefetcherCls({ db: db, store: window.MOCK, eventBus: _bus, camelize: Helpers.camelize });
  var _rtm = new RealtimeMgr({ db: db, eventBus: _bus, store: window.MOCK, viewRefresher: _viewRefresher, detalleRefetcher: _detalleRefetcher });

  // Register default handlers
  var GenericHandler = root.GenericHandler || window.GenericHandler;
  if (GenericHandler) {
    _rtm.registerHandler("productos", new GenericHandler(null, _bus, {
      key: "productos", EntityClass: Proto, primaryKey: "sku",
    }));
    _rtm.registerHandler("cajeros", new GenericHandler(null, _bus, {
      key: "cajeros", EntityClass: Caj, primaryKey: "id",
    }));
    _rtm.registerHandler("usuarios_sistema", new GenericHandler(null, _bus, {
      key: "usuarios_sistema", EntityClass: Usua, primaryKey: "usuario",
    }));
    _rtm.registerHandler("proveedores", new GenericHandler(null, _bus, {
      key: "proveedores", EntityClass: Prov, primaryKey: "id",
    }));
    _rtm.registerHandler("turnos", new GenericHandler(null, _bus, {
      key: "turnos", EntityClass: Tur, primaryKey: "id",
    }));
  }

  // Facturas handler (inline)
  _rtm.registerHandler("facturas", {
    dispatch: function (payload) {
      var M = window.MOCK; if (!M) return;
      var cam = Helpers.camelize;
      var row = cam(payload.new || {});
      var oldRow = cam(payload.old || {});
      if (payload.eventType === "INSERT") {
        if (!M.facturas.find(function(f){return f.id===row.id;}))
          M.facturas.unshift(new Fac(Object.assign({}, row, { items: [] })));
      } else if (payload.eventType === "UPDATE") {
        var idx = M.facturas.findIndex(function(f){return f.id===row.id;});
        if (idx !== -1) {
          var ex = M.facturas[idx];
          M.facturas[idx] = new Fac(Object.assign({}, ex, row, { items: ex.items }));
        }
      } else if (payload.eventType === "DELETE") {
        var did = oldRow.id || row.id;
        var di = M.facturas.findIndex(function(f){return f.id===did;});
        if (di !== -1) M.facturas.splice(di, 1);
      }
      M.facturas.sort(function(a,b){return (b.fecha+b.hora).localeCompare(a.fecha+a.hora);});
      _bus.emit("realtime:facturas", {type:payload.eventType, row:row});
    }
  });

  // Ingresos handler
  _rtm.registerHandler("ingresos", {
    dispatch: function (payload) {
      var M = window.MOCK; if (!M) return;
      var cam = Helpers.camelize;
      var row = cam(payload.new || {});
      var oldRow = cam(payload.old || {});
      if (payload.eventType === "INSERT") {
        if (!M.ingresos.find(function(x){return x.id===row.id;}))
          M.ingresos.unshift(new Ing(Object.assign({}, row, {detalle:[]})));
      } else if (payload.eventType === "UPDATE") {
        var idx = M.ingresos.findIndex(function(x){return x.id===row.id;});
        if (idx !== -1) {
          var ex = M.ingresos[idx];
          M.ingresos[idx] = new Ing(Object.assign({}, ex, row, {detalle:ex.detalle}));
        }
      } else if (payload.eventType === "DELETE") {
        var did = oldRow.id || row.id;
        var di = M.ingresos.findIndex(function(x){return x.id===did;});
        if (di !== -1) M.ingresos.splice(di, 1);
      }
      _bus.emit("realtime:ingresos", {type:payload.eventType, row:row});
    }
  });

  // Factura items handler (realtime for factura_items table)
  _rtm.registerHandler("factura_items", {
    dispatch: function (payload) {
      var M = window.MOCK; if (!M || !M.facturas) return;
      var cam = Helpers.camelize;
      var row = cam(payload.new || {});
      var oldRow = cam(payload.old || {});
      var fid = row.facturaId || row.factura_id;
      var fact = M.facturas.find(function(f){return f.id===fid;});
      if (!fact) return;
      var items = fact.items ? fact.items.slice() : [];
      if (payload.eventType === "INSERT") {
        if (!items.find(function(it){return it.sku===row.sku;}))
          items.push(row);
      } else if (payload.eventType === "UPDATE") {
        var ii = items.findIndex(function(it){return it.sku===row.sku;});
        if (ii !== -1) items[ii] = Object.assign(items[ii], row);
      } else if (payload.eventType === "DELETE") {
        var dsku = oldRow.sku || row.sku;
        items = items.filter(function(it){return it.sku!==dsku;});
      }
      fact.items = items;
      _bus.emit("realtime:facturas", {type:payload.eventType, row:row});
    }
  });

  // Ingreso detalle handler (realtime for ingreso_detalle table)
  _rtm.registerHandler("ingreso_detalle", {
    dispatch: function (payload) {
      var M = window.MOCK; if (!M || !M.ingresos) return;
      var cam = Helpers.camelize;
      var row = cam(payload.new || {});
      var oldRow = cam(payload.old || {});
      var iid = row.ingresoId || row.ingreso_id;
      var ing = M.ingresos.find(function(x){return x.id===iid;});
      if (!ing) return;
      if (!ing.detalle) ing.detalle = [];
      if (payload.eventType === "INSERT") {
        if (!ing.detalle.find(function(d){return d.sku===row.sku;}))
          ing.detalle.push(row);
      } else if (payload.eventType === "UPDATE") {
        var di = ing.detalle.findIndex(function(d){return d.sku===row.sku;});
        if (di !== -1) ing.detalle[di] = Object.assign(ing.detalle[di], row);
      } else if (payload.eventType === "DELETE") {
        var dsku = oldRow.sku || row.sku;
        ing.detalle = ing.detalle.filter(function(d){return d.sku!==dsku;});
      }
      _bus.emit("realtime:ingresos", {type:payload.eventType, row:row});
    }
  });

  // Configuracion handler
  _rtm.registerHandler("configuracion", {
    dispatch: function (payload) {
      var M = window.MOCK; if (!M) return;
      var row = payload.new || {};
      if (row.clave != null) M.configuracion[row.clave] = row.valor;
      _bus.emit("realtime:configuracion", {type:payload.eventType, row:row});
    }
  });

  // ---- hydrateData ----
  window.hydrateData = async function () {
    try {
      await window._dataStore.hydrate();
    } catch (e) { console.error("[hydrateData]", e); }
    window.MOCK = window._dataStore;
    // Wire store into handlers that need it
    _rtm.setStore(window.MOCK);
    _viewRefresher.setStore(window.MOCK);
    _detalleRefetcher.setStore(window.MOCK);
    if (GenericHandler) {
      _rtm._handlers.forEach(function (h) {
        if (h.store !== undefined) h.store = window.MOCK;
      });
    }
    _rtm.start();
    // Notify App that hydration is done (re-render if it was waiting)
    window.dispatchEvent(new CustomEvent("invenpro:hydrated"));
  };

  window.stopRealtime = function () { _rtm.stop(); };

  window.refreshConfig = async function () {
    if (!window.db || !window.MOCK) return;
    try {
      var result = await window.db.from("configuracion").select("*");
      if (result.error || !result.data) return;
      result.data.forEach(function(r){ window.MOCK.configuracion[r.clave] = r.valor; });
    } catch (e) { console.error("refreshConfig:", e); }
  };

  // ---- useRealtimeSync hook (JSX components depend on it) ----
  window.useRealtimeSync = function useRealtimeSync(tables) {
    var _a = React.useState(0);
    var setTick = _a[1];
    React.useEffect(function () {
      var list = Array.isArray(tables) ? tables : [tables];
      var offs = list.map(function(t){
        return _bus.on("realtime:"+t, function(){ setTick(function(n){return n+1;}); });
      });
      return function(){ offs.forEach(function(fn){fn();}); };
    }, [Array.isArray(tables) ? tables.join(",") : tables]);
  };

  // ---- Expose all classes for backward compat (JSX components do instanceof checks) ----
  Object.assign(window, {
    Producto: Proto, Usuario: Usua, Cajero: Caj, Proveedor: Prov, Turno: Tur, Factura: Fac, Ingreso: Ing,
    AuthService: root.AuthService, ProductoService: root.ProductoService,
    FacturaService: root.FacturaService, TurnoService: root.TurnoService,
    CajeroService: root.CajeroService, ProveedorService: root.ProveedorService,
    IngresoService: root.IngresoService, ConfigService: root.ConfigService,
    ProductoRepository: root.ProductoRepository, UsuarioRepository: root.UsuarioRepository,
    CajeroRepository: root.CajeroRepository, ProveedorRepository: root.ProveedorRepository,
    TurnoRepository: root.TurnoRepository, FacturaRepository: root.FacturaRepository,
    IngresoRepository: root.IngresoRepository, ConfigRepository: root.ConfigRepository,
    DataStore: root.DataStore, BaseStore: root.BaseStore,
    AuthUseCase: root.AuthUseCase, InventoryUseCase: root.InventoryUseCase,
  });
})();
