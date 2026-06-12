// InvenPro — Capa de datos: Modelos, Servicios y DataStore
// Todo dentro de un único IIFE para captura de closure confiable.
(function () {
  const today = new Date(2026, 4, 8); // 8 de mayo 2026

  // ══════════ HELPERS ══════════
  const fmt = (d) => d.toISOString().slice(0, 10);

  function camelize(obj) {
    if (Array.isArray(obj)) return obj.map(camelize);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const cc = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[cc] = camelize(v);
      }
      return out;
    }
    return obj;
  }

  function snakify(obj) {
    if (Array.isArray(obj)) return obj.map(snakify);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const sk = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
        out[sk] = v;
      }
      return out;
    }
    return obj;
  }

  const hashPass = async (plain) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // ══════════ MODELOS (6) ══════════

  class Producto {
    constructor(data) {
      this.sku = data.sku;
      this.nombre = data.nombre;
      this.categoria = data.categoria;
      this.precio = data.precio;
      this.costo = data.costo;
      this.stock = data.stock;
      this.min = data.min;
      this.vence = data.vence;
      this.unidad = data.unidad;
      this.codigoBarras = data.codigoBarras;
    }
    get initials() {
      return this.nombre ? this.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
    }
    get stockBajo() { return this.stock < this.min; }
    get valorTotal() { return this.stock * this.costo; }
  }

  class Usuario {
    constructor(data) {
      this.usuario = data.usuario;
      this.nombre = data.nombre;
      this.rol = data.rol;
      this.permisos = data.permisos;
      this.pass = data.pass;
    }
    get initials() {
      return this.nombre ? this.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
    }
    get esAdmin() { return this.rol === "Administrador"; }
  }

  class Cajero {
    constructor(data) {
      this.id = data.id;
      this.nombre = data.nombre;
      this.doc = data.doc;
      this.rol = data.rol;
      this.estado = data.estado;
      this.turnoActivo = data.turnoActivo;
      this.ingreso = data.ingreso;
      this.ventas30d = data.ventas30d;
    }
    get initials() {
      return this.nombre ? this.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
    }
    get activo() { return this.estado === "activo"; }
  }

  class Proveedor {
    constructor(data) {
      this.id = data.id;
      this.nombre = data.nombre;
      this.nit = data.nit;
      this.contacto = data.contacto;
      this.tel = data.tel;
      this.email = data.email;
      this.ciudad = data.ciudad;
      this.categoria = data.categoria;
      this.terminos = data.terminos;
      this.estado = data.estado;
      this.ingresos = data.ingresos;
      this.ultimoIngreso = data.ultimoIngreso;
    }
    get activo() { return this.estado === "activo"; }
  }

  class Turno {
    constructor(data) {
      this.id = data.id;
      this.cajero = data.cajero;
      this.fechaIni = data.fechaIni;
      this.fechaFin = data.fechaFin;
      this.baseIni = data.baseIni;
      this.ventas = data.ventas;
      this.transacciones = data.transacciones;
      this.estado = data.estado;
    }
    get abierto() { return this.estado === "abierto"; }
  }

  class Factura {
    constructor(data) {
      this.id = data.id;
      this.fecha = data.fecha;
      this.hora = data.hora;
      this.cajero = data.cajero;
      this.metodo = data.metodo;
      this.total = data.total;
      this.items = data.items || [];
    }
    get cantidadItems() { return this.items.reduce((sum, it) => sum + (it.q || 0), 0); }
  }

  // ══════════ SERVICIOS (8) ══════════

  class AuthService {
    async login(usuario, pass) {
      if (!window.db) { console.error("Supabase no cargó. Recarga la página."); return null; }
      const hashed = await hashPass(pass);
      let { data, error } = await window.db
        .from("usuarios_sistema").select("*")
        .ilike("usuario", usuario).eq("pass", hashed).maybeSingle();
      if (!error && data) return camelize(data);
      ({ data, error } = await window.db
        .from("usuarios_sistema").select("*")
        .ilike("usuario", usuario).eq("pass", pass).maybeSingle());
      if (error || !data) return null;
      await window.db.from("usuarios_sistema").update({ pass: hashed }).eq("usuario", data.usuario);
      return camelize(data);
    }
    async updatePassword(usuario, newPass) {
      const hashed = await hashPass(newPass);
      const { error } = await window.db.from("usuarios_sistema").update({ pass: hashed }).eq("usuario", usuario);
      if (error) console.error("updatePassword:", error);
      return error;
    }
  }

  class ProductoService {
    async getAll() {
      const { data, error } = await window.db.from("productos").select("*");
      if (error) { console.error("ProductoService.getAll:", error); return []; }
      return camelize(data || []).map(d => new Producto(d));
    }
    async create(p) {
      const { error } = await window.db.from("productos").insert({
        sku: p.sku, nombre: p.nombre, categoria: p.categoria || "General",
        precio: p.precio || 0, costo: p.costo || 0, stock: p.stock || 0,
        min: p.min || 0, vence: p.vence || null, unidad: p.unidad || "und",
        codigo_barras: p.codigoBarras || null,
      });
      if (error) console.error("createProducto:", error);
      return error;
    }
    async update(sku, updates) {
      const row = snakify(updates);
      const { error } = await window.db.from("productos").update(row).eq("sku", sku);
      if (error) console.error("updateProducto:", error);
      return error;
    }
    async updateBarcode(sku, codigoBarras) {
      const { error } = await window.db.from("productos").update({ codigo_barras: codigoBarras }).eq("sku", sku);
      if (error) console.error("updateCodigoBarras:", error);
      return error;
    }
    async incrementStock(sku, qty) {
      const { error } = await window.db.rpc("increment_stock", { p_sku: sku, p_qty: qty });
      if (error) console.error("incrementStock:", error);
      return error;
    }
    generateSku() {
      const productos = (window.MOCK && window.MOCK.productos) || [];
      let max = 0;
      for (const p of productos) {
        const m = p.sku.match(/^P-(\d+)$/);
        if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
      }
      return "P-" + String(max + 1).padStart(5, "0");
    }
  }

  class FacturaService {
    async create(factura, cartItems) {
      const { error: fErr } = await window.db.from("facturas").insert({
        id: factura.id, fecha: factura.fecha, hora: factura.hora,
        cajero: factura.cajero, metodo: factura.metodo, total: factura.total,
      });
      if (fErr) console.error("createFactura header:", fErr);
      const rows = cartItems.map((it) => ({
        factura_id: factura.id, sku: it.sku, nombre: it.nombre, q: it.q, precio: it.precio,
      }));
      const { error: iErr } = await window.db.from("factura_items").insert(rows);
      if (iErr) console.error("createFactura items:", iErr);
      for (const it of cartItems) {
        await window.db.rpc("decrement_stock", { p_sku: it.sku, p_qty: it.q });
      }
    }
  }

  class TurnoService {
    async create(turno) {
      const row = snakify(turno);
      const { error } = await window.db.from("turnos").insert(row);
      if (error) console.error("createTurno:", error);
    }
    async close(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db.from("turnos").update(row).eq("id", id);
      if (error) console.error("closeTurno:", error);
    }
  }

  class CajeroService {
    async update(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db.from("cajeros").update(row).eq("id", id);
      if (error) console.error("updateCajero:", error);
      return error;
    }
    async updateUsuario(usuario, updates) {
      const { error } = await window.db.from("usuarios_sistema").update(updates).eq("usuario", usuario);
      if (error) console.error("updateUsuario:", error);
      return error;
    }
  }

  class ProveedorService {
    async create(p) {
      const row = snakify(p);
      const { error } = await window.db.from("proveedores").insert(row);
      if (error) console.error("createProveedor:", error);
    }
    async update(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db.from("proveedores").update(row).eq("id", id);
      if (error) console.error("updateProveedor:", error);
    }
  }

  class IngresoService {
    async create(ingreso, detalle) {
      const { error: hErr } = await window.db.from("ingresos").insert({
        id: ingreso.id, fecha: ingreso.fecha, proveedor: ingreso.proveedor,
        items: ingreso.items, costo: ingreso.costo, recibe: ingreso.recibe, factura: ingreso.factura,
      });
      if (hErr) console.error("createIngreso header:", hErr);
      const rows = detalle.map((d) => ({
        ingreso_id: ingreso.id, sku: d.sku, nombre: d.nombre,
        qty: d.qty, costo: d.costo, vence: d.vence || null,
      }));
      const { error: dErr } = await window.db.from("ingreso_detalle").insert(rows);
      if (dErr) console.error("createIngreso detalle:", dErr);
    }
    async update(id, header, detalle) {
      const { error: hErr } = await window.db.from("ingresos")
        .update({ proveedor: header.proveedor, factura: header.factura, recibe: header.recibe }).eq("id", id);
      if (hErr) { console.error("updateIngreso header:", hErr); return hErr; }
      const { error: delErr } = await window.db.from("ingreso_detalle").delete().eq("ingreso_id", id);
      if (delErr) { console.error("updateIngreso del:", delErr); return delErr; }
      const rows = detalle.map(d => ({
        ingreso_id: id, sku: d.sku, nombre: d.nombre,
        qty: d.qty, costo: d.costo, vence: d.vence || null,
      }));
      const { error: dErr } = await window.db.from("ingreso_detalle").insert(rows);
      if (dErr) { console.error("updateIngreso detalle:", dErr); return dErr; }
      const totalCosto = detalle.reduce((s, d) => s + d.qty * d.costo, 0);
      await window.db.from("ingresos").update({ items: detalle.length, costo: totalCosto }).eq("id", id);
      return null;
    }
  }

  class ConfigService {
    async save(clave, valor) {
      const v = String(valor ?? "");
      const { error } = await window.db.from("configuracion").upsert({ clave, valor: v }, { onConflict: "clave" });
      if (error) console.error("saveConfig:", error);
      if (window.MOCK && window.MOCK.configuracion) { window.MOCK.configuracion[clave] = v; }
    }
    async saveBatch(entries) {
      const rows = Object.entries(entries).map(([clave, valor]) => ({ clave, valor: String(valor ?? "") }));
      const { error } = await window.db.from("configuracion").upsert(rows, { onConflict: "clave" });
      if (error) console.error("saveConfigBatch:", error);
      if (window.MOCK && window.MOCK.configuracion) {
        for (const { clave, valor } of rows) { window.MOCK.configuracion[clave] = valor; }
      }
    }
  }

  // ══════════ DATASTORE ══════════

  class DataStore {
    constructor() {
      this.today = today;
      this.productos = [];
      this.cajeros = [];
      this.usuarios_sistema = [];
      this.proveedores = [];
      this.turnos = [];
      this.facturas = [];
      this.ingresos = [];
      this.ventasMes = [];
      this.ventasCajero = [];
      this.topProductos = [];
      this.ventasHoy = [];
      this.configuracion = {};
    }
    async hydrate() {
      const d = window.db;
      if (!d) { console.warn("DataStore.hydrate: window.db no disponible"); return; }
      const [
        { data: productos }, { data: cajeros }, { data: usuariosSistema },
        { data: ventasMes }, { data: ventasCajero }, { data: topProductos },
        { data: ventasHoy }, { data: proveedores }, { data: turnos },
        { data: facturas }, { data: ingresos }, { data: configuracion },
      ] = await Promise.all([
        d.from("productos").select("*"),
        d.from("cajeros").select("*"),
        d.from("usuarios_sistema").select("*"),
        d.from("ventas_mes").select("*"),
        d.from("ventas_cajero").select("*"),
        d.from("top_productos").select("*"),
        d.from("ventas_hoy").select("*"),
        d.from("proveedores").select("*"),
        d.from("turnos").select("*"),
        d.from("facturas").select("*, factura_items(*)"),
        d.from("ingresos").select("*, ingreso_detalle(*)"),
        d.from("configuracion").select("*"),
      ]);
      const facturasConItems = (facturas || []).map((f) => {
        const raw = camelize(f);
        raw.items = raw.facturaItems || [];
        delete raw.facturaItems;
        return new Factura(raw);
      });
      facturasConItems.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
      const ingresosConDetalle = (ingresos || []).map((i) => {
        const raw = camelize(i);
        raw.detalle = raw.ingresoDetalle || [];
        delete raw.ingresoDetalle;
        return raw;
      });
      const configMap = {};
      (configuracion || []).forEach(r => { configMap[r.clave] = r.valor; });

      this.productos = camelize(productos || []).map(d => new Producto(d));
      this.cajeros = camelize(cajeros || []).map(d => new Cajero(d));
      this.usuarios_sistema = camelize(usuariosSistema || []).map(d => new Usuario(d));
      this.ventasMes = camelize(ventasMes || []);
      this.ventasCajero = camelize(ventasCajero || []);
      this.topProductos = camelize(topProductos || []);
      this.ventasHoy = camelize(ventasHoy || []);
      this.proveedores = camelize(proveedores || []).map(d => new Proveedor(d));
      this.turnos = camelize(turnos || []).map(d => new Turno(d));
      this.facturas = facturasConItems;
      this.ingresos = ingresosConDetalle;
      this.configuracion = configMap;
    }
  }

  // ══════════ EVENTBUS ══════════

  class EventBus {
    constructor() { this._listeners = {}; }
    on(event, cb) {
      (this._listeners[event] || (this._listeners[event] = [])).push(cb);
      return () => this.off(event, cb);
    }
    off(event, cb) {
      const arr = this._listeners[event];
      if (arr) this._listeners[event] = arr.filter(fn => fn !== cb);
    }
    emit(event, payload) {
      (this._listeners[event] || []).forEach(fn => {
        try { fn(payload); } catch (e) { console.error("[EventBus]", event, e); }
      });
    }
  }

  // ══════════ REALTIME MANAGER ══════════

  const REALTIME_TABLES = [
    "productos", "cajeros", "usuarios_sistema", "proveedores",
    "turnos", "facturas", "factura_items", "ingresos", "ingreso_detalle", "configuracion",
  ];

  class RealtimeManager {
    constructor() {
      this._channel = null;
      this._viewTimer = null;
      this._started = false;
      this._everSubscribed = false;
      this._needResync = false;
      this._detTimers = {};
    }

    start() {
      if (this._started || !window.db) return;
      this._started = true;
      const channel = window.db.channel("invenpro-realtime");

      for (const table of REALTIME_TABLES) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => this._dispatch(table, payload)
        );
      }

      channel.subscribe((status) => {
        console.log("[Realtime]", status);
        if (status === "SUBSCRIBED") {
          // Si veníamos de una caída, los eventos perdidos no se reenvían:
          // hay que resincronizar la caché local completa.
          if (this._needResync) { this._needResync = false; this._resync(); }
          this._everSubscribed = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (this._everSubscribed && this._started) {
            console.warn("[Realtime] conexión perdida; se resincronizará al reconectar");
            this._needResync = true;
          }
        }
      });

      this._channel = channel;
    }

    stop() {
      if (this._channel) {
        window.db.removeChannel(this._channel);
        this._channel = null;
      }
      if (this._viewTimer) { clearTimeout(this._viewTimer); this._viewTimer = null; }
      for (const id of Object.keys(this._detTimers)) clearTimeout(this._detTimers[id]);
      this._detTimers = {};
      this._started = false;
      this._everSubscribed = false;
      this._needResync = false;
    }

    // Recarga toda la caché local tras una reconexión y notifica a los componentes.
    // (Los consumidores releen window.MOCK e ignoran el payload, así que el evento
    // sintético {type:"RESYNC"} solo dispara su re-render.)
    async _resync() {
      if (!window._dataStore) return;
      try {
        await window._dataStore.hydrate();
        ["productos", "cajeros", "usuarios_sistema", "proveedores", "turnos",
         "facturas", "ingresos", "configuracion", "views"]
          .forEach(t => window.EventBus.emit("realtime:" + t, { type: "RESYNC" }));
        console.log("[Realtime] resincronizado tras reconexión");
      } catch (e) {
        console.error("[Realtime] resync:", e);
        this._needResync = true; // reintentar en la próxima reconexión
      }
    }

    _dispatch(table, payload) {
      const M = window.MOCK;
      if (!M) return;
      switch (table) {
        case "productos":       this._handleProductos(M, payload); break;
        case "cajeros":         this._handleSimple(M, "cajeros", Cajero, "id", payload); break;
        case "usuarios_sistema":this._handleSimple(M, "usuarios_sistema", Usuario, "usuario", payload); break;
        case "proveedores":     this._handleSimple(M, "proveedores", Proveedor, "id", payload); break;
        case "turnos":          this._handleSimple(M, "turnos", Turno, "id", payload); break;
        case "facturas":        this._handleFacturas(M, payload); break;
        case "factura_items":   this._handleFacturaItems(M, payload); break;
        case "ingresos":        this._handleIngresos(M, payload); break;
        case "ingreso_detalle": this._handleIngresoDetalle(M, payload); break;
        case "configuracion":   this._handleConfiguracion(M, payload); break;
      }
    }

    // Generic handler for simple tables (cajeros, usuarios_sistema, proveedores, turnos)
    _handleSimple(M, key, Cls, pk, payload) {
      const row = camelize(payload.new || {});
      const oldRow = camelize(payload.old || {});
      const arr = M[key];
      if (payload.eventType === "INSERT") {
        if (!arr.find(x => x[pk] === row[pk])) {
          arr.push(Cls ? new Cls(row) : row);
        }
      } else if (payload.eventType === "UPDATE") {
        const idx = arr.findIndex(x => x[pk] === row[pk]);
        if (idx !== -1) arr[idx] = Cls ? new Cls({ ...arr[idx], ...row }) : { ...arr[idx], ...row };
        else arr.push(Cls ? new Cls(row) : row);
      } else if (payload.eventType === "DELETE") {
        const id = oldRow[pk] || row[pk];
        const idx = arr.findIndex(x => x[pk] === id);
        if (idx !== -1) arr.splice(idx, 1);
      }
      window.EventBus.emit("realtime:" + key, { type: payload.eventType, row });
    }

    _handleProductos(M, payload) {
      this._handleSimple(M, "productos", Producto, "sku", payload);
      this._scheduleViewRefresh();
    }

    _handleFacturas(M, payload) {
      const row = camelize(payload.new || {});
      const oldRow = camelize(payload.old || {});
      if (payload.eventType === "INSERT") {
        if (!M.facturas.find(f => f.id === row.id)) {
          M.facturas.unshift(new Factura({ ...row, items: [] }));
        }
      } else if (payload.eventType === "UPDATE") {
        const idx = M.facturas.findIndex(f => f.id === row.id);
        if (idx !== -1) {
          const existing = M.facturas[idx];
          M.facturas[idx] = new Factura({ ...existing, ...row, items: existing.items });
        }
      } else if (payload.eventType === "DELETE") {
        const id = oldRow.id || row.id;
        const idx = M.facturas.findIndex(f => f.id === id);
        if (idx !== -1) M.facturas.splice(idx, 1);
      }
      M.facturas.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
      window.EventBus.emit("realtime:facturas", { type: payload.eventType, row });
      this._scheduleViewRefresh();
    }

    _handleFacturaItems(M, payload) {
      const row = camelize(payload.new || {});
      if (row.facturaId) {
        const f = M.facturas.find(x => x.id === row.facturaId);
        if (f) {
          if (payload.eventType === "INSERT") {
            if (!f.items.find(it => it.sku === row.sku && it.facturaId === row.facturaId)) {
              f.items.push(row);
            }
          }
          window.EventBus.emit("realtime:facturas", { type: "UPDATE", row: f });
        }
      }
    }

    _handleIngresos(M, payload) {
      const row = camelize(payload.new || {});
      const oldRow = camelize(payload.old || {});
      if (payload.eventType === "INSERT") {
        if (!M.ingresos.find(x => x.id === row.id)) {
          M.ingresos.unshift({ ...row, detalle: [] });
        }
      } else if (payload.eventType === "UPDATE") {
        const idx = M.ingresos.findIndex(x => x.id === row.id);
        if (idx !== -1) {
          const existing = M.ingresos[idx];
          M.ingresos[idx] = { ...existing, ...row, detalle: existing.detalle };
        }
      } else if (payload.eventType === "DELETE") {
        const id = oldRow.id || row.id;
        const idx = M.ingresos.findIndex(x => x.id === id);
        if (idx !== -1) M.ingresos.splice(idx, 1);
      }
      window.EventBus.emit("realtime:ingresos", { type: payload.eventType, row });
      // Editar un ingreso borra y reinserta su detalle; los DELETE de realtime no
      // traen datos útiles (payload.old solo trae la PK), así que tras un UPDATE
      // del encabezado se refetchea el detalle completo de ese ingreso.
      if (payload.eventType === "UPDATE" && row.id) this._scheduleDetalleRefetch(row.id);
    }

    _scheduleDetalleRefetch(id) {
      if (this._detTimers[id]) clearTimeout(this._detTimers[id]);
      this._detTimers[id] = setTimeout(async () => {
        delete this._detTimers[id];
        try {
          const { data, error } = await window.db.from("ingreso_detalle").select("*").eq("ingreso_id", id);
          if (error || !data) return;
          const ing = window.MOCK && window.MOCK.ingresos.find(x => x.id === id);
          if (ing) {
            ing.detalle = camelize(data);
            window.EventBus.emit("realtime:ingresos", { type: "UPDATE", row: ing });
          }
        } catch (e) { console.error("[Realtime] detalle refetch:", e); }
      }, 800);
    }

    _handleIngresoDetalle(M, payload) {
      const row = camelize(payload.new || {});
      if (row.ingresoId) {
        const ing = M.ingresos.find(x => x.id === row.ingresoId);
        if (ing) {
          if (payload.eventType === "INSERT") {
            ing.detalle = ing.detalle || [];
            if (!ing.detalle.find(d => d.sku === row.sku)) ing.detalle.push(row);
          }
          window.EventBus.emit("realtime:ingresos", { type: "UPDATE", row: ing });
        }
      }
    }

    _handleConfiguracion(M, payload) {
      const row = payload.new || {};
      if (row.clave != null) {
        M.configuracion[row.clave] = row.valor;
      }
      window.EventBus.emit("realtime:configuracion", { type: payload.eventType, row });
    }

    _scheduleViewRefresh() {
      if (this._viewTimer) clearTimeout(this._viewTimer);
      this._viewTimer = setTimeout(() => this._refreshViews(), 2000);
    }

    async _refreshViews() {
      const d = window.db;
      const M = window.MOCK;
      if (!d || !M) return;
      try {
        const [
          { data: ventasMes }, { data: ventasCajero },
          { data: topProductos }, { data: ventasHoy },
        ] = await Promise.all([
          d.from("ventas_mes").select("*"),
          d.from("ventas_cajero").select("*"),
          d.from("top_productos").select("*"),
          d.from("ventas_hoy").select("*"),
        ]);
        M.ventasMes = camelize(ventasMes || []);
        M.ventasCajero = camelize(ventasCajero || []);
        M.topProductos = camelize(topProductos || []);
        M.ventasHoy = camelize(ventasHoy || []);
        window.EventBus.emit("realtime:views", {});
      } catch (e) {
        console.error("[Realtime] refreshViews:", e);
      }
    }
  }

  // ══════════ useRealtimeSync HOOK ══════════

  function useRealtimeSync(tables) {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
      const list = Array.isArray(tables) ? tables : [tables];
      const offs = list.map(t => window.EventBus.on("realtime:" + t, () => setTick(n => n + 1)));
      return () => offs.forEach(fn => fn());
    }, [Array.isArray(tables) ? tables.join(",") : tables]);
  }

  // ══════════ INICIALIZACIÓN GLOBAL ══════════

  const _bus = new EventBus();
  const _rtm = new RealtimeManager();
  window.EventBus = _bus;

  window.hashPass = hashPass;
  window.camelize = camelize;
  window.snakify = snakify;

  window.hydrateData = async function () {
    if (!window._dataStore) { window._dataStore = new DataStore(); }
    await window._dataStore.hydrate();
    window.MOCK = window._dataStore;
    // Start realtime after hydration
    _rtm.start();
  };

  window.stopRealtime = function () {
    _rtm.stop();
  };

  // Recarga puntual de la configuración desde la BD.
  // Red de seguridad para que el recibo use los datos de facturación más recientes
  // aunque el WebSocket de realtime esté caído o la sesión lleve mucho tiempo abierta.
  window.refreshConfig = async function () {
    if (!window.db || !window.MOCK) return;
    try {
      const { data, error } = await window.db.from("configuracion").select("*");
      if (error || !data) return;
      data.forEach(r => { window.MOCK.configuracion[r.clave] = r.valor; });
    } catch (e) { console.error("refreshConfig:", e); }
  };

  window.DB = {
    auth: new AuthService(),
    productos: new ProductoService(),
    facturas: new FacturaService(),
    turnos: new TurnoService(),
    cajeros: new CajeroService(),
    proveedores: new ProveedorService(),
    ingresos: new IngresoService(),
    config: new ConfigService(),
  };

  window.fmtCOP = function (n) {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n).toLocaleString("es-CO");
  };
  window.daysFromNow = function (dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const ms = d - today;
    return Math.round(ms / (1000 * 60 * 60 * 24));
  };
  window.todayStr = fmt(today);
  window.useRealtimeSync = useRealtimeSync;

  // Exponer clases para instanceof y UML
  Object.assign(window, {
    Producto, Usuario, Cajero, Proveedor, Turno, Factura,
    AuthService, ProductoService, FacturaService, TurnoService,
    CajeroService, ProveedorService, IngresoService, ConfigService, DataStore,
  });
})();
