// InvenPro — Capa de acceso a datos (Supabase)
// Estrategia "hydrate-first": carga todo en window.MOCK antes de que React monte.
(function () {
  const today = new Date(2026, 4, 8); // 8 de mayo 2026

  // ---------- helpers ----------
  const fmt = (d) => d.toISOString().slice(0, 10);

  // snake_case → camelCase
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

  // camelCase → snake_case
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

  // ---------- hydrateData ----------
  window.hydrateData = async function () {
    const d = window.db;
    if (!d) { console.warn("hydrateData: window.db no disponible"); return; }

    const [
      { data: productos },
      { data: cajeros },
      { data: usuariosSistema },
      { data: ventasMes },
      { data: ventasCajero },
      { data: topProductos },
      { data: ventasHoy },
      { data: proveedores },
      { data: turnos },
      { data: facturas },
      { data: ingresos },
      { data: configuracion },
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

    // Reconstruir facturas con .items anidado
    const facturasConItems = (facturas || []).map((f) => {
      const raw = camelize(f);
      raw.items = raw.facturaItems || [];
      delete raw.facturaItems;
      return raw;
    });
    facturasConItems.sort(
      (a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)
    );

    // Reconstruir ingresos con .detalle anidado
    const ingresosConDetalle = (ingresos || []).map((i) => {
      const raw = camelize(i);
      raw.detalle = raw.ingresoDetalle || [];
      delete raw.ingresoDetalle;
      return raw;
    });

    // Convertir configuracion de filas [{clave, valor}] a objeto {clave: valor}
    const configMap = {};
    (configuracion || []).forEach(r => { configMap[r.clave] = r.valor; });

    window.MOCK = {
      today,
      productos: camelize(productos || []),
      cajeros: camelize(cajeros || []),
      usuarios_sistema: camelize(usuariosSistema || []),
      ventasMes: camelize(ventasMes || []),
      ventasCajero: camelize(ventasCajero || []),
      topProductos: camelize(topProductos || []),
      ventasHoy: camelize(ventasHoy || []),
      proveedores: camelize(proveedores || []),
      turnos: camelize(turnos || []),
      facturas: facturasConItems,
      ingresos: ingresosConDetalle,
      configuracion: configMap,
    };
  };

  // ---------- Hash de contraseñas (SHA-256) ----------
  const hashPass = async (plain) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };
  window.hashPass = hashPass;

  // ---------- DB write operations ----------
  window.DB = {
    async login(usuario, pass) {
      if (!window.db) { console.error("Supabase no cargó. Recarga la página."); return null; }
      const hashed = await hashPass(pass);
      // Intentar con hash primero
      let { data, error } = await window.db
        .from("usuarios_sistema")
        .select("*")
        .ilike("usuario", usuario)
        .eq("pass", hashed)
        .maybeSingle();
      if (!error && data) return camelize(data);
      // Fallback: contraseña aún en texto plano → migrar a hash
      ({ data, error } = await window.db
        .from("usuarios_sistema")
        .select("*")
        .ilike("usuario", usuario)
        .eq("pass", pass)
        .maybeSingle());
      if (error || !data) return null;
      // Auto-migrar a hash
      await window.db.from("usuarios_sistema").update({ pass: hashed }).eq("usuario", data.usuario);
      return camelize(data);
    },

    async createFactura(factura, cartItems) {
      // Insert factura header
      const { error: fErr } = await window.db.from("facturas").insert({
        id: factura.id,
        fecha: factura.fecha,
        hora: factura.hora,
        cajero: factura.cajero,
        metodo: factura.metodo,
        total: factura.total,
      });
      if (fErr) console.error("createFactura header:", fErr);

      // Insert factura items
      const rows = cartItems.map((it) => ({
        factura_id: factura.id,
        sku: it.sku,
        nombre: it.nombre,
        q: it.q,
        precio: it.precio,
      }));
      const { error: iErr } = await window.db
        .from("factura_items")
        .insert(rows);
      if (iErr) console.error("createFactura items:", iErr);

      // Decrement stock via RPC
      for (const it of cartItems) {
        await window.db.rpc("decrement_stock", {
          p_sku: it.sku,
          p_qty: it.q,
        });
      }
    },

    async createProveedor(p) {
      const row = snakify(p);
      const { error } = await window.db.from("proveedores").insert(row);
      if (error) console.error("createProveedor:", error);
    },

    async updateProveedor(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db
        .from("proveedores")
        .update(row)
        .eq("id", id);
      if (error) console.error("updateProveedor:", error);
    },

    async updateIngreso(id, header, detalle) {
      const { error: hErr } = await window.db.from("ingresos")
        .update({ proveedor: header.proveedor, factura: header.factura, recibe: header.recibe })
        .eq("id", id);
      if (hErr) { console.error("updateIngreso header:", hErr); return hErr; }
      // Borrar detalle viejo y reinsertar
      const { error: delErr } = await window.db.from("ingreso_detalle").delete().eq("ingreso_id", id);
      if (delErr) { console.error("updateIngreso del:", delErr); return delErr; }
      const rows = detalle.map(d => ({
        ingreso_id: id, sku: d.sku, nombre: d.nombre,
        qty: d.qty, costo: d.costo, vence: d.vence || null,
      }));
      const { error: dErr } = await window.db.from("ingreso_detalle").insert(rows);
      if (dErr) { console.error("updateIngreso detalle:", dErr); return dErr; }
      // Actualizar totales en header
      const totalCosto = detalle.reduce((s, d) => s + d.qty * d.costo, 0);
      await window.db.from("ingresos").update({ items: detalle.length, costo: totalCosto }).eq("id", id);
      return null;
    },

    async createIngreso(ingreso, detalle) {
      const { error: hErr } = await window.db.from("ingresos").insert({
        id: ingreso.id,
        fecha: ingreso.fecha,
        proveedor: ingreso.proveedor,
        items: ingreso.items,
        costo: ingreso.costo,
        recibe: ingreso.recibe,
        factura: ingreso.factura,
      });
      if (hErr) console.error("createIngreso header:", hErr);

      const rows = detalle.map((d) => ({
        ingreso_id: ingreso.id,
        sku: d.sku,
        nombre: d.nombre,
        qty: d.qty,
        costo: d.costo,
        vence: d.vence || null,
      }));
      const { error: dErr } = await window.db
        .from("ingreso_detalle")
        .insert(rows);
      if (dErr) console.error("createIngreso detalle:", dErr);
    },

    async createProducto(p) {
      const { error } = await window.db.from("productos").insert({
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria || "General",
        precio: p.precio || 0,
        costo: p.costo || 0,
        stock: p.stock || 0,
        min: p.min || 0,
        vence: p.vence || null,
        unidad: p.unidad || "und",
        codigo_barras: p.codigoBarras || null,
      });
      if (error) console.error("createProducto:", error);
      return error;
    },

    async updateCodigoBarras(sku, codigoBarras) {
      const { error } = await window.db
        .from("productos")
        .update({ codigo_barras: codigoBarras })
        .eq("sku", sku);
      if (error) console.error("updateCodigoBarras:", error);
      return error;
    },

    async updateProducto(sku, updates) {
      const row = snakify(updates);
      const { error } = await window.db
        .from("productos")
        .update(row)
        .eq("sku", sku);
      if (error) console.error("updateProducto:", error);
      return error;
    },

    generateSku() {
      const productos = (window.MOCK && window.MOCK.productos) || [];
      let max = 0;
      for (const p of productos) {
        const m = p.sku.match(/^P-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > max) max = n;
        }
      }
      return "P-" + String(max + 1).padStart(5, "0");
    },

    async incrementStock(sku, qty) {
      const { error } = await window.db.rpc("increment_stock", {
        p_sku: sku,
        p_qty: qty,
      });
      if (error) console.error("incrementStock:", error);
      return error;
    },

    async createTurno(turno) {
      const row = snakify(turno);
      const { error } = await window.db.from("turnos").insert(row);
      if (error) console.error("createTurno:", error);
    },

    async closeTurno(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db
        .from("turnos")
        .update(row)
        .eq("id", id);
      if (error) console.error("closeTurno:", error);
    },

    async updateCajero(id, updates) {
      const row = snakify(updates);
      const { error } = await window.db.from("cajeros").update(row).eq("id", id);
      if (error) console.error("updateCajero:", error);
      return error;
    },


    async updateUsuario(usuario, updates) {
      const { error } = await window.db.from("usuarios_sistema").update(updates).eq("usuario", usuario);
      if (error) console.error("updateUsuario:", error);
      return error;
    },


    async saveConfig(clave, valor) {
      const v = String(valor ?? "");
      const { error } = await window.db
        .from("configuracion")
        .upsert({ clave, valor: v }, { onConflict: "clave" });
      if (error) console.error("saveConfig:", error);
      // Actualizar cache local
      if (window.MOCK && window.MOCK.configuracion) {
        window.MOCK.configuracion[clave] = v;
      }
    },

    async saveConfigBatch(entries) {
      // entries = { clave1: valor1, clave2: valor2, ... }
      // Asegurar que todos los valores sean strings (columna TEXT NOT NULL)
      const rows = Object.entries(entries).map(([clave, valor]) => ({
        clave,
        valor: String(valor ?? ""),
      }));
      const { error } = await window.db
        .from("configuracion")
        .upsert(rows, { onConflict: "clave" });
      if (error) console.error("saveConfigBatch:", error);
      // Actualizar cache local
      if (window.MOCK && window.MOCK.configuracion) {
        for (const { clave, valor } of rows) {
          window.MOCK.configuracion[clave] = valor;
        }
      }
    },
  };

  // ---------- utilidades globales ----------
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
})();
