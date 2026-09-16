(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  Object.assign(root, {
    AuthService: root.AuthService || window.AuthService,
    ProductoService: root.ProductoService || window.ProductoService,
    FacturaService: root.FacturaService || window.FacturaService,
    TurnoService: root.TurnoService || window.TurnoService,
    CajeroService: root.CajeroService || window.CajeroService,
    ProveedorService: root.ProveedorService || window.ProveedorService,
    IngresoService: root.IngresoService || window.IngresoService,
    ConfigService: root.ConfigService || window.ConfigService,
  });
})();
