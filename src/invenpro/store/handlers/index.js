(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var GenericHandler = root.GenericHandler || window.GenericHandler;
  var Producto = root.Producto || window.Producto;
  var Cajero = root.Cajero || window.Cajero;
  var Usuario = root.Usuario || window.Usuario;
  var Proveedor = root.Proveedor || window.Proveedor;
  var Turno = root.Turno || window.Turno;
  var Factura = root.Factura || window.Factura;

  var handlers = {
    createGenericHandler: function (store, eventBus, opts) {
      return new GenericHandler(store, eventBus, opts);
    },
    registerDefaultHandlers: function (realtimeManager, store, eventBus) {
      realtimeManager.registerHandler("productos", new GenericHandler(store, eventBus, {
        key: "productos", EntityClass: Producto, primaryKey: "sku",
      }));
      realtimeManager.registerHandler("cajeros", new GenericHandler(store, eventBus, {
        key: "cajeros", EntityClass: Cajero, primaryKey: "id",
      }));
      realtimeManager.registerHandler("usuarios_sistema", new GenericHandler(store, eventBus, {
        key: "usuarios_sistema", EntityClass: Usuario, primaryKey: "usuario",
      }));
      realtimeManager.registerHandler("proveedores", new GenericHandler(store, eventBus, {
        key: "proveedores", EntityClass: Proveedor, primaryKey: "id",
      }));
      realtimeManager.registerHandler("turnos", new GenericHandler(store, eventBus, {
        key: "turnos", EntityClass: Turno, primaryKey: "id",
      }));
    },
  };

  Object.assign(root, { realtimeHandlers: handlers });
})();
