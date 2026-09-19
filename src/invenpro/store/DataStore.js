(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseStore = root.BaseStore || window.BaseStore;

  class DataStore extends BaseStore {
    #entityClasses;
    #productos = [];
    #cajeros = [];
    #usuarios_sistema = [];
    #proveedores = [];
    #turnos = [];
    #facturas = [];
    #ingresos = [];
    #ventasMes = [];
    #ventasCajero = [];
    #topProductos = [];
    #ventasHoy = [];
    #configuracion = {};

    constructor(deps) {
      super(deps);
      deps = deps || {};
      this.#entityClasses = deps.entityClasses || {};
    }

    get productos() { return this.#productos; }
    get cajeros() { return this.#cajeros; }
    get usuarios_sistema() { return this.#usuarios_sistema; }
    get proveedores() { return this.#proveedores; }
    get turnos() { return this.#turnos; }
    get facturas() { return this.#facturas; }
    get ingresos() { return this.#ingresos; }
    get ventasMes() { return this.#ventasMes; }
    get ventasCajero() { return this.#ventasCajero; }
    get topProductos() { return this.#topProductos; }
    get ventasHoy() { return this.#ventasHoy; }
    get configuracion() { return this.#configuracion; }

    setProductos(items) { this.#productos = items; }
    setCajeros(items) { this.#cajeros = items; }
    setUsuariosSistema(items) { this.#usuarios_sistema = items; }
    setProveedores(items) { this.#proveedores = items; }
    setTurnos(items) { this.#turnos = items; }
    setFacturas(items) { this.#facturas = items; }
    setIngresos(items) { this.#ingresos = items; }
    setVentasMes(items) { this.#ventasMes = items; }
    setVentasCajero(items) { this.#ventasCajero = items; }
    setTopProductos(items) { this.#topProductos = items; }
    setVentasHoy(items) { this.#ventasHoy = items; }
    setConfiguracion(map) { this.#configuracion = map; }

    _getClass(name) {
      return this.#entityClasses[name] || root[name] || window[name];
    }

    // ---- Mutation methods (called by GenericHandler / realtime) ----
    addProducto(p) { if (!this.#productos.find(function(x){return x.sku===p.sku;})) this.#productos.unshift(p); }
    removeProducto(sku) { this.#productos = this.#productos.filter(function(x){return x.sku!==sku;}); }
    updateProducto(sku, data) { var i=this.#productos.findIndex(function(x){return x.sku===sku;}); if(i!==-1) this.#productos[i]=data; }

    addCajero(c) { if (!this.#cajeros.find(function(x){return x.id===c.id;})) this.#cajeros.unshift(c); }
    removeCajero(id) { this.#cajeros = this.#cajeros.filter(function(x){return x.id!==id;}); }
    updateCajero(id, data) { var i=this.#cajeros.findIndex(function(x){return x.id===id;}); if(i!==-1) this.#cajeros[i]=data; }

    addUsuario(u) { if (!this.#usuarios_sistema.find(function(x){return x.usuario===u.usuario;})) this.#usuarios_sistema.unshift(u); }
    removeUsuario(usuario) { this.#usuarios_sistema = this.#usuarios_sistema.filter(function(x){return x.usuario!==usuario;}); }
    updateUsuario(usuario, data) { var i=this.#usuarios_sistema.findIndex(function(x){return x.usuario===usuario;}); if(i!==-1) this.#usuarios_sistema[i]=data; }

    addProveedor(p) { if (!this.#proveedores.find(function(x){return x.id===p.id;})) this.#proveedores.unshift(p); }
    removeProveedor(id) { this.#proveedores = this.#proveedores.filter(function(x){return x.id!==id;}); }
    updateProveedor(id, data) { var i=this.#proveedores.findIndex(function(x){return x.id===id;}); if(i!==-1) this.#proveedores[i]=data; }

    addTurno(t) { if (!this.#turnos.find(function(x){return x.id===t.id;})) this.#turnos.unshift(t); }
    removeTurno(id) { this.#turnos = this.#turnos.filter(function(x){return x.id!==id;}); }
    updateTurno(id, data) { var i=this.#turnos.findIndex(function(x){return x.id===id;}); if(i!==-1) this.#turnos[i]=data; }

    addFactura(f) { if (!this.#facturas.find(function(x){return x.id===f.id;})) this.#facturas.unshift(f); }
    removeFactura(id) { this.#facturas = this.#facturas.filter(function(x){return x.id!==id;}); }
    updateFactura(id, data) { var i=this.#facturas.findIndex(function(x){return x.id===id;}); if(i!==-1) this.#facturas[i]=data; }
    sortFacturas() { this.#facturas.sort(function(a,b){return (b.fecha+b.hora).localeCompare(a.fecha+a.hora);}); }

    addIngreso(i) { if (!this.#ingresos.find(function(x){return x.id===i.id;})) this.#ingresos.unshift(i); }
    removeIngreso(id) { this.#ingresos = this.#ingresos.filter(function(x){return x.id!==id;}); }
    updateIngreso(id, data) { var i=this.#ingresos.findIndex(function(x){return x.id===id;}); if(i!==-1) this.#ingresos[i]=data; }

    setConfigValue(clave, valor) { this.#configuracion[clave] = valor; }

    async hydrate() {
      var db = this.db;
      if (!db) {
        console.warn("DataStore.hydrate: db no disponible");
        return;
      }

      var q = this._queryWithTimeout.bind(this);
      var camelize = this._camelize.bind(this);

      var Producto = this._getClass("Producto");
      var Cajero = this._getClass("Cajero");
      var Usuario = this._getClass("Usuario");
      var Proveedor = this._getClass("Proveedor");
      var Turno = this._getClass("Turno");
      var Factura = this._getClass("Factura");

      var results = await Promise.all([
        q(db.from("productos").select("*"), "productos"),
        q(db.from("cajeros").select("*"), "cajeros"),
        q(db.from("usuarios_sistema").select("usuario,nombre,rol,permisos"), "usuarios_sistema"),
        q(db.from("ventas_mes").select("*"), "ventas_mes"),
        q(db.from("ventas_cajero").select("*"), "ventas_cajero"),
        q(db.from("top_productos").select("*"), "top_productos"),
        q(db.from("ventas_hoy").select("*"), "ventas_hoy"),
        q(db.from("proveedores").select("*"), "proveedores"),
        q(db.from("turnos").select("*"), "turnos"),
        q(db.from("facturas").select("*, factura_items(*)"), "facturas"),
        q(db.from("ingresos").select("*, ingreso_detalle(*)"), "ingresos"),
        q(db.from("configuracion").select("*"), "configuracion"),
      ]);

      var facturas = results[9] && results[9].data || [];
      var facturasConItems = facturas.map(function (f) {
        var raw = camelize(f);
        raw.items = raw.facturaItems || [];
        delete raw.facturaItems;
        return new Factura(raw);
      });
      facturasConItems.sort(function (a, b) {
        return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
      });

      var ingresos = results[10] && results[10].data || [];
      var ingresosConDetalle = ingresos.map(function (i) {
        var raw = camelize(i);
        raw.detalle = raw.ingresoDetalle || [];
        delete raw.ingresoDetalle;
        return raw;
      });

      this.#productos = camelize(results[0] && results[0].data || []).map(function (d) { return new Producto(d); });
      this.#cajeros = camelize(results[1] && results[1].data || []).map(function (d) { return new Cajero(d); });
      this.#usuarios_sistema = camelize(results[2] && results[2].data || []).map(function (d) { return new Usuario(d); });
      this.#ventasMes = camelize(results[3] && results[3].data || []);
      this.#ventasCajero = camelize(results[4] && results[4].data || []);
      this.#topProductos = camelize(results[5] && results[5].data || []);
      this.#ventasHoy = camelize(results[6] && results[6].data || []);
      this.#proveedores = camelize(results[7] && results[7].data || []).map(function (d) { return new Proveedor(d); });
      this.#turnos = camelize(results[8] && results[8].data || []).map(function (d) { return new Turno(d); });
      this.#facturas = facturasConItems;
      this.#ingresos = ingresosConDetalle;
      this.#configuracion = this._buildConfigMap(results[11] && results[11].data);
    }
  }

  root.DataStore = DataStore;
  window.DataStore = DataStore;
})();
