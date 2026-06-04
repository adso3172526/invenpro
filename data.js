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
    };
  };

  // ---------- DB write operations ----------
  window.DB = {
    async login(usuario, pass) {
      const { data, error } = await window.db
        .from("usuarios_sistema")
        .select("*")
        .ilike("usuario", usuario)
        .eq("pass", pass)
        .maybeSingle();
      if (error || !data) return null;
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
