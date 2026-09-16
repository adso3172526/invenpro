(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class IngresoController {
    constructor(deps) {
      deps = deps || {};
      this._store = deps.store || null;
      this._productoService = deps.productoService || null;
      this._ingresoService = deps.ingresoService || null;
    }

    getProviders() {
      var defaultProviders = [
        { nombre: "Distribuidora El Sol", nit: "900.124.567-8", tel: "(4) 444 1820" },
        { nombre: "Lacteos del Valle", nit: "830.998.221-2", tel: "(2) 660 1245" },
        { nombre: "Frutiverduras Mayor", nit: "901.445.118-3", tel: "(1) 320 7790" },
        { nombre: "Aseo y Hogar S.A.S", nit: "900.778.412-1", tel: "(4) 511 8900" },
      ];
      var store = this._store;
      return defaultProviders.concat(store && store.proveedores || []);
    }

    getCategoriasAll() {
      var store = this._store;
      var cfg = store && store.configuracion || {};
      var custom = [];
      try {
        var value = JSON.parse(cfg.categorias || "[]");
        if (Array.isArray(value)) custom = value;
      } catch (e) { custom = []; }

      var map = new Map();
      map.set("General", { nombre: "General", activo: true });

      custom.forEach(function (entry) {
        var nombre = typeof entry === "string" ? entry : entry && entry.nombre;
        if (!nombre) return;
        var activo = typeof entry === "string" ? true : entry.activo !== false;
        map.set(nombre, { nombre: nombre, activo: activo });
      });

      (store && store.productos || []).forEach(function (producto) {
        if (producto.categoria && !map.has(producto.categoria)) {
          map.set(producto.categoria, { nombre: producto.categoria, activo: true });
        }
      });

      return Array.from(map.values()).sort(function (a, b) {
        if (a.nombre === "General") return -1;
        if (b.nombre === "General") return 1;
        return a.nombre.localeCompare(b.nombre);
      });
    }

    getCategorias() {
      return this.getCategoriasAll()
        .filter(function (c) { return c.activo; })
        .map(function (c) { return c.nombre; });
    }

    getIngresos(range) {
      range = range || {};
      var store = this._store;
      var list = store && store.ingresos || [];
      return list.filter(function (ing) {
        if (!range.desde || !range.hasta) return true;
        return ing.fecha >= range.desde && ing.fecha <= range.hasta;
      }).sort(function (a, b) {
        return (b.fecha || "").localeCompare(a.fecha || "") || (b.id || "").localeCompare(a.id || "");
      });
    }

    nextSku(items) {
      items = items || [];
      var store = this._store;
      var used = new Set();
      (store && store.productos || []).forEach(function (p) { used.add(p.sku); });
      items.forEach(function (item) { used.add(item.sku); });
      var max = 0;
      used.forEach(function (sku) {
        var match = /^P-(\d+)$/.exec(sku || "");
        if (match) max = Math.max(max, parseInt(match[1], 10));
      });
      return "P-" + String(max + 1).padStart(5, "0");
    }

    buildItem(opts) {
      var store = this._store;
      var product = opts.producto || (store && store.productos || []).find(function (p) { return p.sku === opts.sku; });
      var esNuevo = !product;
      var itemName = product ? product.nombre : (opts.nombre || opts.nombreManual || opts.sku);

      return {
        sku: opts.sku || (esNuevo ? this.nextSku() : product.sku),
        nombre: itemName,
        qty: parseInt(opts.qty, 10) || 0,
        costo: parseInt(opts.costo, 10) || 0,
        vence: opts.vence || null,
        nuevo: esNuevo,
        codigoBarras: opts.codigoBarras || (product && product.codigoBarras) || "",
        categoria: esNuevo ? (opts.categoriaManual || "General") : undefined,
        precio: parseInt(opts.precio, 10) || (product ? product.precio : Math.round((parseInt(opts.costo, 10) || 0) * 1.3)),
      };
    }

    validateForm(opts) {
      var faltantes = [];
      if (!opts.proveedor) faltantes.push("proveedor");
      if (!(opts.provActual && (opts.provActual.nit || "").trim())) faltantes.push("NIT del proveedor");
      if (!(opts.factura || "").trim()) faltantes.push("N° factura");
      if (opts.items.length === 0) faltantes.push("al menos un ítem");
      else if (opts.items.some(function (item) { return !item.qty || item.qty <= 0; })) faltantes.push("cantidad en cada ítem");
      return { ok: faltantes.length === 0, faltantes: faltantes };
    }

    async _crearProductosNuevos(nuevos, items) {
      var svc = this._productoService;
      var store = this._store;
      for (var i = 0; i < nuevos.length; i++) {
        var item = nuevos[i];
        var sku = item.sku || this.nextSku(items);
        var payload = {
          sku: sku, nombre: item.nombre, categoria: item.categoria || "General",
          precio: item.precio || Math.round((Number(item.costo) || 0) * 1.3),
          costo: Number(item.costo) || 0, stock: Number(item.qty) || 0,
          vence: item.vence || null, codigoBarras: item.codigoBarras || null,
          unidad: "und", min: 0,
        };

        var error = await svc.create(payload);
        if (error) return { ok: false, message: "Error creando producto: " + (item.nombre || sku) };
        if (store && store.productos) store.productos.push(Object.assign({}, payload, { sku: sku }));
      }
      return { ok: true };
    }

    async _actualizarStockExistente(existentes) {
      var svc = this._productoService;
      for (var j = 0; j < existentes.length; j++) {
        var exItem = existentes[j];
        var error = await svc.incrementStock(exItem.sku, Number(exItem.qty) || 0);
        if (error) return { ok: false, message: "Error actualizando stock de " + (exItem.nombre || exItem.sku) };
      }
      return { ok: true };
    }

    async _registrarIngreso(ingreso, detalle) {
      var svc = this._ingresoService;
      var error = await svc.create(ingreso, detalle);
      if (error) return { ok: false, message: "Error al guardar el ingreso: " + (error.message || "Intenta de nuevo") };
      return { ok: true };
    }

    async registerIngreso(opts) {
      var nuevos = opts.items.filter(function (item) { return item.nuevo; });
      var existentes = opts.items.filter(function (item) { return !item.nuevo; });
      var total = opts.items.reduce(function (sum, item) {
        return sum + Number(item.qty || 0) * Number(item.costo || 0);
      }, 0);

      var result = await this._crearProductosNuevos(nuevos, opts.items);
      if (!result.ok) return result;

      result = await this._actualizarStockExistente(existentes);
      if (!result.ok) return result;

      var ingreso = {
        id: "ING-" + Date.now(),
        fecha: new Date().toISOString().slice(0, 10),
        proveedor: opts.proveedor,
        items: opts.items.length,
        costo: total,
        recibe: opts.recibido || "Administrador",
        factura: opts.factura,
      };

      result = await this._registrarIngreso(ingreso, opts.items);
      if (!result.ok) return result;

      return {
        ok: true,
        message: "Ingreso registrado · " + nuevos.length + " producto(s) creado(s) · stock actualizado.",
        createdCount: nuevos.length,
      };
    }
  }

  root.IngresoController = IngresoController;
  window.IngresoController = IngresoController;
})();
