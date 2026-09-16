// InvenPro — Barrel aggregator
// Loads AFTER all modules. Aggregates all classes to window.InvenPro namespace.
(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  // Core
  root.EventBus = root.EventBus || window.EventBus;
  root.ServiceContainer = root.ServiceContainer || window.ServiceContainer;
  root.BaseEntity = root.BaseEntity || window.BaseEntity;
  root.BaseService = root.BaseService || window.BaseService;
  root.BaseRepository = root.BaseRepository || window.BaseRepository;
  root.BaseStore = root.BaseStore || window.BaseStore;
  root.Helpers = root.Helpers || window.Helpers;

  // Interfaces
  root.IEntity = root.IEntity || window.IEntity;
  root.IRepository = root.IRepository || window.IRepository;
  root.IService = root.IService || window.IService;
  root.IController = root.IController || window.IController;
  root.IRealtimeHandler = root.IRealtimeHandler || window.IRealtimeHandler;

  // Domain
  root.Producto = root.Producto || window.Producto;
  root.Usuario = root.Usuario || window.Usuario;
  root.Cajero = root.Cajero || window.Cajero;
  root.Proveedor = root.Proveedor || window.Proveedor;
  root.Turno = root.Turno || window.Turno;
  root.Factura = root.Factura || window.Factura;
  root.Ingreso = root.Ingreso || window.Ingreso;

  // Repositories
  root.ProductoRepository = root.ProductoRepository || window.ProductoRepository;
  root.UsuarioRepository = root.UsuarioRepository || window.UsuarioRepository;
  root.CajeroRepository = root.CajeroRepository || window.CajeroRepository;
  root.ProveedorRepository = root.ProveedorRepository || window.ProveedorRepository;
  root.TurnoRepository = root.TurnoRepository || window.TurnoRepository;
  root.FacturaRepository = root.FacturaRepository || window.FacturaRepository;
  root.IngresoRepository = root.IngresoRepository || window.IngresoRepository;
  root.ConfigRepository = root.ConfigRepository || window.ConfigRepository;
  root.RepositoryFactory = root.RepositoryFactory || window.RepositoryFactory;

  // Services
  root.AuthService = root.AuthService || window.AuthService;
  root.ProductoService = root.ProductoService || window.ProductoService;
  root.FacturaService = root.FacturaService || window.FacturaService;
  root.TurnoService = root.TurnoService || window.TurnoService;
  root.CajeroService = root.CajeroService || window.CajeroService;
  root.ProveedorService = root.ProveedorService || window.ProveedorService;
  root.IngresoService = root.IngresoService || window.IngresoService;
  root.ConfigService = root.ConfigService || window.ConfigService;

  // Store
  root.DataStore = root.DataStore || window.DataStore;
  root.RealtimeManager = root.RealtimeManager || window.RealtimeManager;
  root.ViewRefresher = root.ViewRefresher || window.ViewRefresher;
  root.DetalleRefetcher = root.DetalleRefetcher || window.DetalleRefetcher;
  root.GenericHandler = root.GenericHandler || window.GenericHandler;

  // Application
  root.AuthUseCase = root.AuthUseCase || window.AuthUseCase;
  root.InventoryUseCase = root.InventoryUseCase || window.InventoryUseCase;
  root.InventoryController = root.InventoryController || window.InventoryController;
  root.ProveedorController = root.ProveedorController || window.ProveedorController;
  root.IngresoController = root.IngresoController || window.IngresoController;
  root.AppController = root.AppController || window.AppController;
  root.DashboardController = root.DashboardController || window.DashboardController;
  root.CajeroController = root.CajeroController || window.CajeroController;
  root.ReportesController = root.ReportesController || window.ReportesController;
  root.VencimientosController = root.VencimientosController || window.VencimientosController;
  root.ShiftController = root.ShiftController || window.ShiftController;
})();
