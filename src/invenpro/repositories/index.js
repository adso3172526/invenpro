(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  Object.assign(root, {
    BaseRepository: root.BaseRepository || window.BaseRepository,
    ProductoRepository: root.ProductoRepository || window.ProductoRepository,
    UsuarioRepository: root.UsuarioRepository || window.UsuarioRepository,
    CajeroRepository: root.CajeroRepository || window.CajeroRepository,
    ProveedorRepository: root.ProveedorRepository || window.ProveedorRepository,
    TurnoRepository: root.TurnoRepository || window.TurnoRepository,
    FacturaRepository: root.FacturaRepository || window.FacturaRepository,
    IngresoRepository: root.IngresoRepository || window.IngresoRepository,
    ConfigRepository: root.ConfigRepository || window.ConfigRepository,
    RepositoryFactory: root.RepositoryFactory || window.RepositoryFactory,
  });
})();
