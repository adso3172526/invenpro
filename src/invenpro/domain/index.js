(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  Object.assign(root, {
    BaseEntity: root.BaseEntity || window.BaseEntity,
    Producto: root.Producto || window.Producto,
    Usuario: root.Usuario || window.Usuario,
    Cajero: root.Cajero || window.Cajero,
    Proveedor: root.Proveedor || window.Proveedor,
    Turno: root.Turno || window.Turno,
    Factura: root.Factura || window.Factura,
    Ingreso: root.Ingreso || window.Ingreso,
  });
})();
