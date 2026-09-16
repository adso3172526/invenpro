(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  Object.assign(root, {
    AuthUseCase: root.AuthUseCase || window.AuthUseCase,
    InventoryUseCase: root.InventoryUseCase || window.InventoryUseCase,
    InventoryController: root.InventoryController || window.InventoryController,
    ProveedorController: root.ProveedorController || window.ProveedorController,
    IngresoController: root.IngresoController || window.IngresoController,
    AppController: root.AppController || window.AppController,
    DashboardController: root.DashboardController || window.DashboardController,
    CajeroController: root.CajeroController || window.CajeroController,
    ReportesController: root.ReportesController || window.ReportesController,
    VencimientosController: root.VencimientosController || window.VencimientosController,
    ShiftController: root.ShiftController || window.ShiftController,
  });
})();
