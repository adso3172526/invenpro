// Flujo del cajero: apertura de turno → POS → cierre
const { useState, useEffect, useMemo } = React;

// =================== Apertura de turno ===================
const ShiftOpen = ({ cajero, onOpen, onLogout }) => {
  const [base, setBase] = useState(200000);
  const [caja, setCaja] = useState("Caja 01");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null); // turno ya abierto del cajero

  const handleOpen = async () => {
    setLoading(true);
    // Un cajero solo puede tener UN turno abierto: verificar en la BD antes de crear
    try {
      const { data } = await window.db
        .from("turnos").select("*")
        .eq("cajero", cajero.nombre).eq("estado", "abierto").limit(1);
      if (data && data.length) {
        setExisting(window.camelize(data[0]));
        setLoading(false);
        return;
      }
    } catch (err) { console.error("checkTurnoAbierto:", err); }

    const now = new Date();
    const turnoId = "T-" + Date.now();
    const fechaIni = now.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
    // Solo campos que existen en la tabla turnos
    const turnoRow = {
      id: turnoId,
      cajero: cajero.nombre,
      fechaIni,
      fechaFin: null,
      estado: "abierto",
      baseIni: base,
      ventas: 0,
      transacciones: 0,
    };
    try {
      await DB.turnos.create(turnoRow);
    } catch (err) {
      console.error("createTurno:", err);
    }
    // Pasar al POS con datos adicionales para la UI
    onOpen({ ...turnoRow, caja, base, ini: now });
  };

  const reanudar = () => {
    const t = existing;
    onOpen({ ...t, caja: t.caja || caja, base: t.baseIni || base, ini: new Date() });
  };

  return (
    <div className="shift-open-shell">
      <div className="card shift-open-card">
        <div className="card-h tw-flex-col tw-items-start tw-p-6 md:tw-p-8">
          <div className="row tw-mb-2">
            <img src="logo.png" alt="InvenPro" className="tw-h-[32px] tw-object-contain"/>
          </div>
          <h3 className="tw-text-2xl tw-font-semibold tw-tracking-tight tw-my-1.5">Abrir turno</h3>
          <p className="muted tw-m-0 tw-text-sm">Hola {cajero.nombre}. Confirma la base de caja inicial para empezar a facturar.</p>
        </div>
        <div className="card-b tw-p-6 md:tw-p-8">
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
            <div className="field">
              <label>Cajero</label>
              <input value={cajero.nombre} readOnly/>
            </div>
            <div className="field">
              <label>Fecha y hora</label>
              <input value={new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })} readOnly/>
            </div>
          </div>
          <div className="field">
            <label>Caja asignada</label>
            <select value={caja} onChange={e => setCaja(e.target.value)}>
              <option>Caja 01</option><option>Caja 02</option><option>Caja 03</option>
            </select>
          </div>
          <div className="field">
            <label>Base inicial en efectivo (COP)</label>
            <input className="mono" value={base.toLocaleString("es-CO")}
              onChange={e => setBase(parseInt(e.target.value.replace(/\D/g, "")) || 0)}/>
            <div className="cash-suggestions tw-flex tw-flex-wrap tw-gap-1.5">
              {[100000, 150000, 200000, 250000, 300000].map(v => (
                <button key={v} type="button" onClick={() => setBase(v)}>${v.toLocaleString("es-CO")}</button>
              ))}
            </div>
          </div>
        </div>
        {existing && (
          <div style={{ padding: "0 24px" }}>
            <div className="tw-bg-warn-soft tw-text-warn tw-rounded-lg tw-p-3 tw-text-sm tw-font-medium">
              Ya tienes un turno abierto{existing.fechaIni ? ` desde ${existing.fechaIni}` : ""}. Debes cerrarlo antes de abrir uno nuevo.
            </div>
          </div>
        )}
        <div className="modal-f tw-bg-surface-2 tw-p-6 md:tw-px-8">
          {existing
            ? <button className="btn primary" onClick={reanudar}>Reanudar turno abierto <Icon name="arrowRight"/></button>
            : <button className="btn primary" disabled={loading} onClick={handleOpen}>{loading ? "Abriendo…" : "Abrir turno"} <Icon name="arrowRight"/></button>}
          <button className="btn ghost" onClick={onLogout}><Icon name="logout"/> Salir</button>
        </div>
      </div>
    </div>
  );
};

// =================== Escáner de código de barras ===================
// Escáner CONTINUO: queda abierto y agrega varios productos seguidos.
const BarcodeScanner = ({ onScan, onClose, closeOnScan }) => {
  const scannerRef = React.useRef(null);
  const lastRef = React.useRef({ code: null, t: 0 }); // debounce de lecturas repetidas
  const closingRef = React.useRef(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [last, setLast] = useState(null);   // { ok, msg } del último escaneo
  const [flash, setFlash] = useState(false);

  // Detiene la cámara y, SOLO cuando terminó, ejecuta fn (evita el crash removeChild).
  const stopThen = (fn) => {
    const s = scannerRef.current;
    if (!s) { fn(); return; }
    let done = false;
    const run = () => { if (!done) { done = true; fn(); } };
    try { const p = s.stop(); (p && p.then) ? p.then(run, run) : run(); } catch { run(); }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        // Modo "un disparo": lee un código, detiene la cámara y cierra (para llenar un campo)
        if (closeOnScan) {
          if (closingRef.current) return;
          closingRef.current = true;
          try { if (navigator.vibrate) navigator.vibrate(60); } catch {}
          stopThen(() => onScan(decodedText));
          return;
        }
        const now = Date.now();
        // Ignora el mismo código si se leyó hace < 1.8s (la librería dispara muchas veces/seg)
        if (decodedText === lastRef.current.code && now - lastRef.current.t < 1800) return;
        lastRef.current = { code: decodedText, t: now };
        const r = onScan(decodedText) || { ok: true, msg: "" };
        try { if (navigator.vibrate) navigator.vibrate(r.ok ? 60 : [40, 40, 40]); } catch {}
        setLast(r);
        if (r.ok) setCount(c => c + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 220);
      },
      () => {}
    ).catch(() => setError("No se pudo acceder a la cámara"));

    return () => {
      const s = scannerRef.current;
      if (!s || closingRef.current) return; // ya se detuvo al cerrar
      try { const p = s.stop(); if (p && p.catch) p.catch(() => {}); } catch {}
    };
  }, []);

  // Cierra deteniendo la cámara primero
  const closeScanner = () => {
    if (closingRef.current) { onClose(); return; }
    closingRef.current = true;
    stopThen(onClose);
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[102] tw-bg-black tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-bg-black/80">
        <button className="tw-bg-transparent tw-border-0 tw-text-white tw-cursor-pointer tw-p-1" onClick={closeScanner}>
          <Icon name="arrowRight" size={20} style={{ transform: "rotate(180deg)" }}/>
        </button>
        <span className="tw-text-white tw-font-semibold tw-text-sm tw-flex-1">Escanear productos</span>
        {count > 0 && (
          <span className="tw-bg-accent tw-text-white tw-text-xs tw-font-bold tw-rounded-full tw-min-w-[24px] tw-h-6 tw-px-2 tw-grid tw-place-items-center">{count}</span>
        )}
      </div>

      {/* Viewfinder */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-6 tw-gap-4">
        {error ? (
          <div className="tw-text-center tw-text-white tw-flex tw-flex-col tw-gap-4 tw-items-center">
            <Icon name="alert" size={40}/>
            <p className="tw-text-sm tw-opacity-80">{error}</p>
            <button className="tw-bg-white tw-text-black tw-border-0 tw-rounded-xl tw-py-3 tw-px-6 tw-text-sm tw-font-semibold tw-cursor-pointer"
              onClick={closeScanner}>
              Ingresar manualmente
            </button>
          </div>
        ) : (
          <>
            <div id="barcode-reader" className="tw-w-full tw-max-w-[320px] tw-rounded-2xl tw-overflow-hidden"
              style={{ boxShadow: flash ? "0 0 0 4px var(--good)" : undefined, transition: "box-shadow .15s ease" }}/>
            {last && (
              <div className={"tw-text-sm tw-font-semibold tw-px-4 tw-py-2 tw-rounded-lg tw-text-center tw-max-w-[320px] " + (last.ok ? "tw-bg-good-soft tw-text-good" : "tw-bg-bad-soft tw-text-bad")}>
                {last.ok ? "✓ " : "✗ "}{last.msg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón Listo / Cerrar */}
      {!error && (
        <div className="tw-px-6 tw-pb-8 tw-pt-2">
          <button className="tw-w-full tw-bg-accent tw-text-white tw-border-0 tw-rounded-xl tw-py-3.5 tw-text-sm tw-font-semibold tw-cursor-pointer"
            onClick={closeScanner}>
            {count > 0 ? `Listo · ${count} producto${count !== 1 ? "s" : ""}` : "Cerrar"}
          </button>
        </div>
      )}
    </div>
  );
};

// =================== POS principal ===================
// Las categorías del POS ahora son DINÁMICAS (getCategorias() = config + las que usan
// los productos), ya no una lista fija. Ver el useMemo `cats` dentro de POS.

const POS = ({ shift, cajero, onCloseShift, onLogout }) => {
  const [productos, setProductos] = useState(() => MOCK.productos.map(p => p));
  const [cart, setCart] = useState([]);
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [pay, setPay] = useState(null); // null | 'modal'
  const [done, setDone] = useState(null); // factura cerrada
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(true);
  const [shiftStats, setShiftStats] = useState({
    ventas: shift.ventas || 0,
    trans: shift.transacciones || 0,
    items: 0,
    porMetodo: { Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0 },
  });
  // Descuentos locales optimistas aún no confirmados por el servidor (sku -> unidades)
  const pendingStock = React.useRef({});
  const prevServer = React.useRef({});

  // Reconstruye la grilla desde el servidor (MOCK.productos) aplicando los descuentos
  // locales pendientes; cada pendiente se libera cuando el servidor confirma la baja.
  const rebuildFromServer = () => {
    const pend = pendingStock.current;
    const prev = prevServer.current;
    const nextPrev = {};
    const out = MOCK.productos.map(mp => {
      const serverStock = mp.stock;
      nextPrev[mp.sku] = serverStock;
      let p = pend[mp.sku] || 0;
      if (p > 0 && typeof prev[mp.sku] === "number") {
        const drop = prev[mp.sku] - serverStock; // el servidor bajó stock => confirmó una venta
        if (drop > 0) p = Math.max(0, p - drop);
      }
      pend[mp.sku] = p;
      return new Producto({
        sku: mp.sku,
        nombre: mp.nombre,
        categoria: mp.categoria,
        precio: mp.precio,
        costo: mp.costo,
        stock: Math.max(0, serverStock - p),
        min: mp.min,
        vence: mp.vence,
        unidad: mp.unidad,
        codigoBarras: mp.codigoBarras,
        fotoUrl: mp.fotoUrl,
      });
    });
    prevServer.current = nextPrev;
    setProductos(out);
  };

  // Al entrar al POS, refresca los datos de facturación desde la BD
  // (red de seguridad por si el realtime estaba caído cuando el admin los cambió)
  useEffect(() => { if (window.refreshConfig) window.refreshConfig(); }, []);

  // Realtime: los productos nuevos y los cambios de stock (ingresos de mercancía,
  // ventas de otros cajeros) se reflejan en la grilla, respetando los descuentos
  // locales que este cajero hizo y que el servidor aún no confirma.
  useEffect(() => {
    return window.EventBus.on("realtime:productos", rebuildFromServer);
  }, []);

  // Categorías dinámicas: "Todos" + las activas de la config + las que usan los
  // productos (getCategorias). Reaccionan al realtime de productos (renombres) y a
  // los cambios de config (crear/renombrar/activar), para reflejarse al instante.
  const [catTick, setCatTick] = useState(0);
  useEffect(() => {
    const off1 = window.EventBus.on("config:change", () => setCatTick(n => n + 1));
    const off2 = window.EventBus.on("realtime:configuracion", () => setCatTick(n => n + 1));
    return () => { off1(); off2(); };
  }, []);
  const cats = useMemo(() => ["Todos", ...getCategorias()], [productos, catTick]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return productos.filter(p =>
      (cat === "Todos" || p.categoria === cat) &&
      (!ql || p.nombre.toLowerCase().includes(ql) || p.sku.toLowerCase().includes(ql) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(ql)))
    );
  }, [productos, cat, q]);
  // Desktop: paginación de 16 por página (4×4) — la página se llena completa (16)
  // antes de crear la siguiente (con 12 quedaban huecos). Móvil: sin paginar, scrollea.
  const pagProd = usePagination(filtered, 16);

  const totals = useMemo(() => {
    const sub = cart.reduce((s, l) => s + l.q * l.precio, 0);
    const iva = Math.round(sub * 0.0); // exento simplificado
    return { sub, iva, total: sub + iva, items: cart.reduce((s, l) => s + l.q, 0) };
  }, [cart]);

  const addToCart = (p) => {
    if (p.stock <= 0) { setToast("Sin stock disponible"); return; }
    setMobileCartExpanded(true);
    setCart(c => {
      const i = c.findIndex(l => l.sku === p.sku);
      if (i >= 0) {
        const stockLeft = p.stock - c[i].q;
        if (stockLeft <= 0) { setToast(`Solo hay ${p.stock} unidades de ${p.nombre}`); return c; }
        return c.map((l, idx) => idx === i ? { ...l, q: l.q + 1 } : l);
      }
      return [...c, { sku: p.sku, nombre: p.nombre, q: 1, precio: p.precio, stockMax: p.stock, codigoBarras: p.codigoBarras }];
    });
  };
  const setQty = (sku, delta) => {
    setCart(c => c.flatMap(l => {
      if (l.sku !== sku) return [l];
      const next = l.q + delta;
      if (next <= 0) return [];
      if (next > l.stockMax) { setToast(`Stock máximo: ${l.stockMax}`); return [l]; }
      return [{ ...l, q: next }];
    }));
  };
  const removeLine = (sku) => setCart(c => c.filter(l => l.sku !== sku));

  // Escaneo continuo: NO cierra el escáner; devuelve resultado para mostrarlo dentro de la cámara
  const handleBarcodeScan = (code) => {
    const p = productos.find(x => x.codigoBarras === code)
           || productos.find(x => x.sku === code);
    if (!p) return { ok: false, msg: `Código "${code}" no encontrado` };
    if (p.stock <= 0) return { ok: false, msg: `${p.nombre}: sin stock` };
    addToCart(p);
    return { ok: true, msg: p.nombre };
  };

  // Restaura el desglose por medio (por_metodo) al reanudar un turno abierto
  React.useEffect(() => {
    if (!shift.id) return;
    (async () => {
      try {
        const { data } = await window.db.from("turnos")
          .select("ventas,transacciones,por_metodo").eq("id", shift.id).maybeSingle();
        if (data) {
          setShiftStats(s => {
            const vacia = !s.porMetodo || Object.values(s.porMetodo).every(v => !v);
            const pmBD = (data.por_metodo && typeof data.por_metodo === "object")
              ? { Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0, ...data.por_metodo }
              : s.porMetodo;
            return {
              ...s,
              ventas: Math.max(s.ventas, data.ventas || 0),
              trans: Math.max(s.trans, data.transacciones || 0),
              porMetodo: vacia ? pmBD : s.porMetodo,
            };
          });
        }
      } catch (e) { console.error("refrescar turno al abrir POS:", e); }
    })();
  }, []);

  const completePay = async (pago) => {
    // pago = { metodo, pagos:[{metodo,monto}], recibido, cambio }
    // Reservar el descuento localmente (UI inmediata) y refrescar la grilla.
    cart.forEach(l => { pendingStock.current[l.sku] = (pendingStock.current[l.sku] || 0) + l.q; });
    rebuildFromServer();
    const ahora = new Date();
    const fechaActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
    const factura = {
      id: "F-" + Date.now(),   // id ÚNICO global (el esquema viejo "F-"+(10310+trans) chocaba con facturas existentes y el INSERT fallaba)
      fecha: fechaActual,
      hora: ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      cajero: cajero.nombre,
      caja: shift.caja,
      metodo: pago.metodo,
      items: [...cart],
      pagos: pago.pagos || [],
      total: totals.total,
      recibido: pago.recibido,
      cambio: pago.cambio,
    };
    const pm = shiftStats.porMetodo || { Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0 };
    const nuevoPorMetodo = { ...pm };
    (pago.pagos || []).forEach(p => { nuevoPorMetodo[p.metodo] = (nuevoPorMetodo[p.metodo] || 0) + p.monto; });
    const newStats = { ventas: shiftStats.ventas + totals.total, trans: shiftStats.trans + 1, items: shiftStats.items + totals.items, porMetodo: nuevoPorMetodo };
    setShiftStats(newStats);
    setDone(factura);
    setPay(null);
    setCart([]);
    // Persistir factura (con su desglose de pagos) en Supabase
    DB.facturas.create(factura, factura.items).catch(err => console.error("POS persist:", err));
    // Actualizar turno con totales + desglose por medio (sobreviven si el cajero sale sin cerrar)
    if (shift.id) {
      DB.turnos.close(shift.id, { ventas: newStats.ventas, transacciones: newStats.trans, porMetodo: nuevoPorMetodo })
        .catch(err => console.error("updateTurno stats:", err));
    }
  };

  const [cerrando, setCerrando] = useState(false);
  const closeShift = async (datos) => {
    if (cerrando) return;
    const now = new Date();
    const pm = shiftStats.porMetodo || { Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0 };
    const esperado = (shift.base || 0) + (pm.Efectivo || 0);   // efectivo esperado = base + ventas en efectivo
    const contado = (datos && datos.efectivoContado != null) ? datos.efectivoContado : esperado;
    const summary = { ...shift, ...shiftStats, cierre: now, esperado, contado, diferencia: contado - esperado };

    setCerrando(true);
    // Recuperar el id del turno: la sesión a veces lo pierde (restaurada de una
    // versión vieja). Si falta, se busca el turno ABIERTO del cajero en la BD.
    let turnoId = shift.id;
    if (!turnoId) {
      try {
        const { data } = await window.db.from("turnos").select("id")
          .eq("cajero", cajero.nombre).eq("estado", "abierto")
          .order("id", { ascending: false }).limit(1);
        if (data && data.length) turnoId = data[0].id;
      } catch (e) { console.error("recuperar turno:", e); }
    }
    if (!turnoId) {
      setCerrando(false);
      setToast("No se pudo cerrar: no se encontró un turno abierto para este cajero. Recarga la página e intenta de nuevo.");
      return;
    }

    // Cierre ATÓMICO e idempotente vía RPC fn_cerrar_turno: marca el turno 'cerrado'
    // y registra el arqueo en UNA sola transacción (con bloqueo de fila). Evita el
    // estado a medias "arqueo creado pero turno abierto" y los dobles cierres cuando
    // el mismo cajero tiene el turno abierto en dos equipos. Si la función aún no
    // existe en la BD, cae al método de 2 pasos (fallback) para no romper nada.
    const fechaFin = now.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
    let cerrado = false;
    try {
      const { status, error } = await DB.cierres.cerrarTurno({
        p_turno_id: turnoId, p_fecha_fin: fechaFin,
        p_ventas: shiftStats.ventas, p_transacciones: shiftStats.trans, p_por_metodo: pm,
        p_base_inicial: shift.base || 0,
        p_ventas_efectivo: pm.Efectivo || 0, p_ventas_transferencia: pm.Transferencia || 0,
        p_ventas_nequi: pm.Nequi || 0, p_ventas_daviplata: pm.Daviplata || 0,
        p_total_ventas: shiftStats.ventas,
        p_esperado_efectivo: esperado, p_efectivo_contado: contado, p_diferencia: contado - esperado,
        p_observaciones: (datos && datos.observaciones) || null,
      });
      if (error) {
        const noExisteFn = /PGRST202|does not exist|could not find the function|schema cache/i.test((error.message || "") + " " + (error.code || "") + " " + (error.hint || ""));
        if (!noExisteFn) throw error; // error real -> abortar; "función inexistente" -> fallback
      } else {
        if (status === "no_existe") { setCerrando(false); setToast("No se encontró el turno para cerrar. Recarga la página e intenta."); return; }
        cerrado = true; // 'ok' o 'ya_cerrado' (otro equipo ya lo cerró) -> el turno quedó cerrado
      }
    } catch (err) {
      console.error("closeShift (rpc):", err);
      setCerrando(false);
      setToast("No se pudo guardar el cierre: " + ((err && err.message) || "error de conexión") + ". El turno sigue abierto; reintenta.");
      return;
    }

    if (!cerrado) {
      // Fallback (BD sin fn_cerrar_turno aún): método de 2 pasos de antes.
      try {
        const errTurno = await DB.turnos.close(turnoId, { fechaFin, estado: "cerrado", ventas: shiftStats.ventas, transacciones: shiftStats.trans });
        if (errTurno) throw errTurno;
        const errCierre = await DB.cierres.create({
          turnoId: turnoId, baseInicial: shift.base || 0,
          ventasEfectivo: pm.Efectivo || 0, ventasTransferencia: pm.Transferencia || 0,
          ventasNequi: pm.Nequi || 0, ventasDaviplata: pm.Daviplata || 0,
          totalVentas: shiftStats.ventas, transacciones: shiftStats.trans,
          esperadoEfectivo: esperado, efectivoContado: contado, diferencia: contado - esperado,
          observaciones: (datos && datos.observaciones) || null,
        });
        if (errCierre) throw errCierre;
      } catch (err) {
        console.error("closeShift (fallback):", err);
        setCerrando(false);
        setToast("No se pudo guardar el cierre: " + ((err && err.message) || "error de conexión") + ". El turno sigue abierto; reintenta.");
        return;
      }
    }
    setCerrando(false);
    onCloseShift(summary);
  };

  return (
    <div className="pos-shell tw-h-screen tw-flex tw-flex-col tw-bg-bg tw-overflow-hidden" style={{ height: "100dvh" }}>
      {/* height: 100dvh = alto visible real en móvil (excluye la barra del navegador);
          tw-h-screen (100vh) queda como fallback si el navegador no soporta dvh */}
      {/* Topbar — Desktop */}
      <div className="topbar tw-hidden md:tw-flex tw-items-center tw-gap-2">
        <div className="crumb tw-flex-1 tw-min-w-0">
          <img src="logo.png" alt="InvenPro" className="tw-h-[22px] tw-object-contain"/>
          <h1>Caja {shift.caja.replace("Caja ", "")}</h1>
          <span className="muted">·</span>
          <span className="sub">{cajero.nombre}</span>
          <span className="chip good"><span className="dot"/> Turno abierto</span>
        </div>
        <div className="actions tw-flex tw-items-center tw-gap-2">
          <span className="muted mono tw-text-xs">{shiftStats.trans} ventas · {window.fmtCOP(shiftStats.ventas)}</span>
          <button className="btn sm" onClick={onLogout} title="Salir sin cerrar turno"><Icon name="arrowRight" size={14}/> Salir</button>
          <button className="btn sm" onClick={() => setClosing(true)}><Icon name="logout" size={14}/> Cerrar turno</button>
        </div>
      </div>

      {/* Topbar — Mobile: app-style header */}
      <div className="md:tw-hidden tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2.5 tw-bg-surface tw-border-b tw-border-border tw-shrink-0">
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-accent-soft tw-text-accent tw-grid tw-place-items-center">
            <Icon name="store" size={15}/>
          </div>
          <div>
            <div className="tw-text-sm tw-font-bold tw-leading-tight">{shift.caja}</div>
            <div className="tw-text-[10px] tw-text-txt-3">{cajero.nombre}</div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-1">
          {shiftStats.trans > 0 && (
            <div className="tw-text-right tw-mr-2">
              <div className="mono tw-text-[11px] tw-font-semibold tw-text-accent">{window.fmtCOP(shiftStats.ventas)}</div>
              <div className="tw-text-[9px] tw-text-txt-3">{shiftStats.trans} ventas</div>
            </div>
          )}
          <button className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-border tw-bg-surface tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-2 tw-transition-colors" onClick={onLogout} title="Salir">
            <Icon name="arrowRight" size={14}/>
          </button>
          <button className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-border tw-bg-surface tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-2 tw-transition-colors" onClick={() => setClosing(true)} title="Cerrar turno">
            <Icon name="logout" size={14}/>
          </button>
        </div>
      </div>

      {/* Layout POS */}
      <div className="pos tw-flex-1 tw-min-h-0 tw-overflow-hidden">
        {/* ===== Desktop: estructura original con pos-left ===== */}
        <div className="pos-left pos-desktop-view tw-hidden md:tw-flex">
          <div className="pos-search">
            <Icon name="search" size={18}/>
            <input
              autoFocus
              placeholder="Escanea código de barras, busca por nombre o digita el código…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const term = q.trim();
                  if (!term) return;
                  let p = productos.find(x => x.codigoBarras === term);
                  if (!p) p = productos.find(x => x.sku === term);
                  if (!p) p = filtered[0];
                  if (p) { addToCart(p); setQ(""); }
                  else setToast(`Sin coincidencias para "${term}"`);
                }
              }}
            />
            <span className="chip accent" title="Listo para escanear"><span className="dot"/> Escáner</span>
            <span className="kbd">↵</span>
          </div>
          <div className="cat-tabs">
            {cats.map(c => (
              <button key={c} className={"cat-tab" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="product-grid">
            {pagProd.slice.map(p => (
              <button key={p.sku} className="product" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                <div className="thumb" style={{ height: "auto", aspectRatio: "1 / 1", overflow: "hidden" }}>{p.fotoUrl ? <img src={p.fotoUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}/> : <Icon name="box" size={22}/>}</div>
                <div className="name">{p.nombre}</div>
                <div className="meta">
                  <span className="mono">{p.codigoBarras || p.sku}</span>
                  <span className={p.stock < p.min ? "stock-bad" : ""}>{p.stock} {p.unidad}</span>
                </div>
                <div className="price mono">{window.fmtCOP(p.precio)}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="icon"><Icon name="search" size={22}/></div>
                Sin resultados para "{q}"
              </div>
            )}
          </div>
          <Pagination {...pagProd} label="productos"/>
        </div>

        {/* Desktop cart — columna derecha, idéntico al original */}
        <div className="cart tw-hidden md:tw-flex tw-bg-surface tw-border-l tw-border-border tw-flex-col tw-min-h-0">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2.5 tw-border-b tw-border-border tw-shrink-0">
            <div>
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold">Venta actual</h3>
              <div className="mono tw-text-[10px] tw-text-txt-3">Ticket #{(10310 + shiftStats.trans).toString().padStart(6, "0")}</div>
            </div>
            {cart.length > 0 && (
              <button className="btn sm danger" onClick={() => setCart([])}><Icon name="trash" size={12}/> Vaciar</button>
            )}
          </div>
          {cart.length === 0 ? (
            <div className="tw-flex-1 tw-overflow-y-auto tw-min-h-0">
              <div className="tw-grid tw-place-items-center tw-h-full tw-text-txt-3 tw-text-center tw-py-4">
                <div>
                  <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-surface-2 tw-grid tw-place-items-center tw-mx-auto tw-mb-2">
                    <Icon name="cart" size={18}/>
                  </div>
                  <div className="tw-font-semibold tw-text-txt-2 tw-text-xs tw-mb-0.5">Carrito vacío</div>
                  <div className="tw-text-[11px]">Selecciona productos o escanea un código</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-flex-1 tw-overflow-y-auto tw-min-h-0 tw-px-3 tw-py-1">
              {cart.map((l, i) => (
                <div key={l.sku} className={"tw-grid tw-grid-cols-[1fr_auto] tw-items-center tw-gap-1 tw-py-1.5 tw-px-0.5" + (i < cart.length - 1 ? " tw-border-b tw-border-dashed tw-border-border" : "")}>
                  <div>
                    <div className="tw-text-xs tw-font-medium tw-leading-tight">{l.nombre}</div>
                    <div className="mono tw-text-[10px] tw-text-txt-3">{window.fmtCOP(l.precio)} × {l.q}</div>
                    <div className="tw-inline-flex tw-items-center tw-border tw-border-border tw-rounded tw-overflow-hidden tw-mt-0.5">
                      <button className="tw-bg-transparent tw-border-0 tw-w-7 tw-h-7 tw-grid tw-place-items-center hover:tw-bg-surface-2 tw-cursor-pointer" onClick={() => setQty(l.sku, -1)}><Icon name="minus" size={11}/></button>
                      <span className="tw-px-1.5 tw-tabular-nums tw-text-[11px] tw-font-medium">{l.q}</span>
                      <button className="tw-bg-transparent tw-border-0 tw-w-7 tw-h-7 tw-grid tw-place-items-center hover:tw-bg-surface-2 tw-cursor-pointer" onClick={() => setQty(l.sku, +1)}><Icon name="plus" size={11}/></button>
                    </div>
                  </div>
                  <div className="tw-text-right">
                    <div className="mono tw-font-semibold tw-text-xs tw-tabular-nums">{window.fmtCOP(l.q * l.precio)}</div>
                    <button className="tw-text-txt-3 tw-text-[10px] tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer hover:tw-text-bad" onClick={() => removeLine(l.sku)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="tw-px-3 tw-py-2.5 tw-border-t tw-border-border tw-bg-surface-2 tw-shrink-0">
            <div className="tw-flex tw-justify-between tw-py-0.5 tw-text-xs tw-text-txt-2 tw-tabular-nums"><span>{totals.items} productos</span><span>{window.fmtCOP(totals.sub)}</span></div>
            <div className="tw-flex tw-justify-between tw-mt-1 tw-pt-1.5 tw-border-t tw-border-border tw-text-base tw-font-semibold tw-tracking-tight tw-tabular-nums">
              <span>Total</span><span>{window.fmtCOP(totals.total)}</span>
            </div>
            <button className="btn accent full tw-mt-2 tw-py-2.5 tw-text-sm tw-font-semibold" disabled={cart.length === 0} onClick={() => setPay("modal")}>
              <Icon name="cart" size={15}/> Cobrar {window.fmtCOP(totals.total)}
            </button>
          </div>
        </div>

        {/* ===== Mobile: diseño tipo app nativa ===== */}
        <div className="pos-mobile-view tw-flex tw-flex-col md:tw-hidden tw-flex-1 tw-min-h-0 tw-h-full tw-overflow-hidden tw-bg-bg">

          {/* Buscador con estilo pill */}
          <div className="pos-mobile-search tw-px-3 tw-pt-3 tw-pb-2 tw-shrink-0">
            <div className="tw-flex tw-items-center tw-gap-2 tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-px-3 tw-py-2.5 tw-shadow-sm">
              <Icon name="search" size={16}/>
              <input
                placeholder="Buscar producto o escanear código…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="tw-flex-1 tw-border-0 tw-bg-transparent tw-outline-none tw-text-sm"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const term = q.trim();
                    if (!term) return;
                    let p = productos.find(x => x.codigoBarras === term);
                    if (!p) p = productos.find(x => x.sku === term);
                    if (!p) p = filtered[0];
                    if (p) { addToCart(p); setQ(""); }
                    else setToast(`Sin coincidencias para "${term}"`);
                  }
                }}
              />
              {q && (
                <button className="tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer tw-text-txt-3" onClick={() => setQ("")}><Icon name="x" size={14}/></button>
              )}
              <button className="tw-bg-accent tw-text-white tw-border-0 tw-rounded-lg tw-w-10 tw-h-10 tw-grid tw-place-items-center tw-cursor-pointer tw-shrink-0"
                onClick={() => setScanOpen(true)} title="Escanear código">
                <Icon name="scan" size={16}/>
              </button>
            </div>
          </div>

          {/* Categorías — pills horizontales */}
          <div className="pos-mobile-categories tw-px-3 tw-pb-2 tw-shrink-0">
            <div className="tw-flex tw-gap-1.5 tw-overflow-x-auto tw-pb-0.5" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              {cats.map(c => (
                <button key={c}
                  className={"tw-shrink-0 tw-text-[11px] tw-font-medium tw-py-1.5 tw-px-3 tw-rounded-full tw-border tw-cursor-pointer tw-transition-all "
                    + (cat === c
                      ? "tw-bg-accent tw-text-white tw-border-accent tw-shadow-sm"
                      : "tw-bg-surface tw-text-txt-2 tw-border-border hover:tw-border-accent")}
                  onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Productos — grid con tarjetas bonitas */}
          <div className="pos-mobile-products tw-flex-1 tw-overflow-y-auto tw-px-3 tw-pb-3 tw-min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="pos-mobile-product-grid tw-grid tw-grid-cols-2 min-[400px]:tw-grid-cols-3 tw-gap-2">
              {filtered.map(p => {
                const inCart = cart.find(l => l.sku === p.sku);
                return (
                  <button key={p.sku}
                    className={"tw-relative tw-bg-surface tw-border tw-rounded-xl tw-p-2.5 tw-text-left tw-flex tw-flex-col tw-gap-1.5 active:tw-scale-[0.96] tw-transition-all tw-cursor-pointer disabled:tw-opacity-30 disabled:tw-cursor-not-allowed "
                      + (inCart ? "tw-border-accent tw-shadow-sm" : "tw-border-border")}
                    onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                    {inCart && (
                      <span className="tw-absolute tw-top-[-6px] tw-right-[-4px] tw-bg-accent tw-text-white tw-text-[9px] tw-font-bold tw-w-[18px] tw-h-[18px] tw-rounded-full tw-grid tw-place-items-center tw-shadow-sm">{inCart.q}</span>
                    )}
                    <div className="tw-w-full tw-rounded-lg tw-overflow-hidden tw-grid tw-place-items-center" style={{ aspectRatio: "1 / 1", background: "var(--surface-2)" }}>
                      {p.fotoUrl ? <img src={p.fotoUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}/> : <span style={{ fontSize: 22 }}>📷</span>}
                    </div>
                    <div className="tw-text-[11px] tw-font-semibold tw-leading-snug tw-line-clamp-2 tw-min-h-[2.6em]">{p.nombre}</div>
                    <div className="mono tw-text-xs tw-font-bold tw-text-accent">{window.fmtCOP(p.precio)}</div>
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-1">
                      <span className={"tw-text-[9px] tw-font-medium " + (p.stock < p.min ? "tw-text-bad" : "tw-text-txt-3")}>{p.stock} {p.unidad}</span>
                      {p.stock <= p.min && p.stock > 0 && <span className="tw-text-[8px] tw-text-warn tw-font-semibold">Bajo</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="tw-text-center tw-py-10">
                <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-surface-2 tw-grid tw-place-items-center tw-mx-auto tw-mb-2 tw-text-txt-3">
                  <Icon name="search" size={22}/>
                </div>
                <div className="tw-text-sm tw-font-medium tw-text-txt-2">Sin resultados</div>
                <div className="tw-text-xs tw-text-txt-3">No encontramos "{q}"</div>
              </div>
            )}
          </div>

          {/* Carrito flotante / bottom bar */}
          <div className="pos-mobile-cart tw-shrink-0 tw-bg-surface tw-border-t tw-border-border tw-shadow-lg">
            {cart.length === 0 ? (
              /* Empty: barra mínima con icono */
              <div className="pos-mobile-cart-empty tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-text-txt-3">
                <Icon name="cart" size={15}/>
                <span className="tw-text-xs">Carrito vacío</span>
              </div>
            ) : (<>
              {/* Encabezado toggle para expandir / contraer items */}
              <div
                className="pos-mobile-cart-header tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-1.5 tw-bg-surface-2 tw-border-b tw-border-border tw-cursor-pointer select-none"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 16px",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onClick={() => setMobileCartExpanded(v => !v)}
              >
                <div
                  className="pos-mobile-cart-header-title tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-txt-2"
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "var(--text-2)" }}
                >
                  <Icon name="cart" size={14}/>
                  <span>{totals.items} ítem{totals.items !== 1 ? "s" : ""} en venta</span>
                </div>
                <div
                  className="pos-mobile-cart-header-action tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-text-txt-3"
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-3)" }}
                >
                  <span>{mobileCartExpanded ? "Ocultar detalle" : "Ver detalle"}</span>
                  <Icon name={mobileCartExpanded ? "chevronDown" : "chevronUp"} size={13}/>
                </div>
              </div>

              {/* Items del carrito — expandible y con scroll interno delimitado */}
              {mobileCartExpanded && (
                <div
                  className="pos-mobile-cart-items tw-max-h-[25vh] tw-overflow-y-auto"
                  style={{ maxHeight: "25vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
                >
                  {cart.map((l, i) => (
                    <div
                      key={l.sku}
                      className={"pos-mobile-cart-item tw-flex tw-items-center tw-gap-2.5 tw-px-4 tw-py-2" + (i < cart.length - 1 ? " tw-border-b tw-border-border" : "")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 16px",
                        borderBottom: i < cart.length - 1 ? "1px solid var(--border)" : "none"
                      }}
                    >
                      <div
                        className="pos-mobile-cart-badge tw-w-8 tw-h-8 tw-rounded-lg tw-bg-accent-soft tw-text-accent tw-grid tw-place-items-center tw-shrink-0"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                          flexShrink: 0
                        }}
                      >
                        {l.q}
                      </div>
                      <div className="pos-mobile-cart-info tw-flex-1 tw-min-w-0" style={{ flex: 1, minWidth: 0 }}>
                        <div className="pos-mobile-cart-name tw-text-xs tw-font-medium tw-leading-tight tw-truncate" style={{ fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {l.nombre}
                        </div>
                        <div className="pos-mobile-cart-price-unit mono tw-text-[10px] tw-text-txt-3" style={{ fontSize: "10px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                          {window.fmtCOP(l.precio)} c/u
                        </div>
                      </div>
                      <div className="pos-mobile-cart-actions tw-flex tw-items-center tw-gap-1.5 tw-shrink-0" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <div
                          className="pos-mobile-cart-qty-ctrl tw-inline-flex tw-items-center tw-border tw-border-border tw-rounded-lg tw-overflow-hidden tw-bg-surface-2"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "var(--surface-2)"
                          }}
                        >
                          <button
                            type="button"
                            className="tw-bg-transparent tw-border-0 tw-w-8 tw-h-8 tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-3 tw-transition-colors"
                            style={{ background: "transparent", border: 0, width: "30px", height: "30px", display: "grid", placeItems: "center", cursor: "pointer" }}
                            onClick={() => setQty(l.sku, -1)}
                          >
                            <Icon name="minus" size={12}/>
                          </button>
                          <span
                            className="tw-px-1 tw-tabular-nums tw-text-[11px] tw-font-semibold tw-min-w-[18px] tw-text-center"
                            style={{ padding: "0 4px", minWidth: "18px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}
                          >
                            {l.q}
                          </span>
                          <button
                            type="button"
                            className="tw-bg-transparent tw-border-0 tw-w-8 tw-h-8 tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-3 tw-transition-colors"
                            style={{ background: "transparent", border: 0, width: "30px", height: "30px", display: "grid", placeItems: "center", cursor: "pointer" }}
                            onClick={() => setQty(l.sku, +1)}
                          >
                            <Icon name="plus" size={12}/>
                          </button>
                        </div>
                        <span
                          className="pos-mobile-cart-line-total mono tw-font-semibold tw-text-xs tw-tabular-nums tw-min-w-[56px] tw-text-right"
                          style={{ fontFamily: "var(--mono)", fontWeight: "600", fontSize: "12px", minWidth: "56px", textAlign: "right" }}
                        >
                          {window.fmtCOP(l.q * l.precio)}
                        </span>
                        <button
                          type="button"
                          className="tw-text-txt-3 tw-bg-transparent tw-border-0 tw-p-1 tw-cursor-pointer hover:tw-text-bad tw-transition-colors"
                          style={{ background: "transparent", border: 0, padding: "4px", color: "var(--text-3)", cursor: "pointer" }}
                          onClick={() => removeLine(l.sku)}
                        >
                          <Icon name="x" size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer fijo: total + cobrar */}
              <div
                className="pos-mobile-cart-footer tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-2.5 tw-border-t tw-border-border tw-bg-surface-2 tw-shrink-0"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
                  borderTop: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  className="pos-mobile-cart-btn-trash tw-bg-transparent tw-border tw-border-border tw-rounded-lg tw-w-9 tw-h-9 tw-grid tw-place-items-center tw-cursor-pointer tw-text-bad hover:tw-bg-bad-soft tw-transition-colors tw-shrink-0"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--bad)",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                  onClick={() => setCart([])}
                  title="Vaciar carrito"
                >
                  <Icon name="trash" size={15}/>
                </button>
                <div
                  className="pos-mobile-cart-summary tw-flex-1 tw-cursor-pointer select-none"
                  style={{ flex: 1, minWidth: 0, cursor: "pointer", userSelect: "none" }}
                  onClick={() => setMobileCartExpanded(v => !v)}
                >
                  <div className="pos-mobile-cart-summary-count tw-text-[10px] tw-text-txt-3" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {totals.items} producto{totals.items !== 1 ? "s" : ""}
                  </div>
                  <div className="pos-mobile-cart-summary-total mono tw-text-lg tw-font-bold tw-tracking-tight tw-leading-tight tw-text-accent" style={{ fontFamily: "var(--mono)", fontSize: "18px", fontWeight: "700", color: "var(--accent)" }}>
                    {window.fmtCOP(totals.total)}
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-cobrar-mobile"
                  className="pos-mobile-cart-btn-cobrar tw-bg-accent tw-text-white tw-border-0 tw-rounded-xl tw-py-2.5 tw-px-5 tw-text-sm tw-font-bold tw-cursor-pointer tw-shadow-sm active:tw-scale-[0.97] tw-transition-transform tw-flex tw-items-center tw-gap-1.5 tw-shrink-0 hover:tw-brightness-110"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "0",
                    borderRadius: "12px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    flexShrink: 0
                  }}
                  onClick={() => setPay("modal")}
                >
                  <Icon name="cart" size={16}/> Cobrar
                </button>
              </div>
            </>)}
          </div>
        </div>
      </div>

      {pay && <PaymentModal total={totals.total} items={totals.items} onClose={() => setPay(null)} onPay={completePay}/>}
      {done && <ReceiptModal factura={done} onClose={() => setDone(null)}/>}
      {closing && <CloseShiftModal shift={shift} stats={shiftStats} onClose={() => setClosing(false)} onConfirm={closeShift} saving={cerrando}/>}
      {scanOpen && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScanOpen(false)}/>}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </div>
  );
};

// =================== Modal de pago ===================
const METODOS_PAGO = [
  {
    id: "Efectivo",
    label: "Efectivo",
    sub: "Billetes y monedas (admite cambio)",
    icon: "banknote",
    color: "var(--good)",
    badge: "Admite cambio",
    isCash: true,
  },
  {
    id: "Transferencia",
    label: "Transferencia",
    sub: "Bancolombia, Tarjeta, PSE",
    icon: "creditCard",
    color: "var(--accent)",
    badge: "Monto exacto",
    isCash: false,
  },
  {
    id: "Nequi",
    label: "Nequi",
    sub: "Transferencia QR o celular Nequi",
    icon: "smartphone",
    color: "#9333EA",
    badge: "Monto exacto",
    isCash: false,
  },
  {
    id: "Daviplata",
    label: "Daviplata",
    sub: "Transferencia app Daviplata",
    icon: "smartphone",
    color: "#E11D48",
    badge: "Monto exacto",
    isCash: false,
  },
];

const PaymentModal = ({ total, items, onClose, onPay }) => {
  const [montos, setMontos] = useState({ Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0 });
  const [activo, setActivo] = useState("Efectivo"); // medio al que apuntan el teclado y los atajos
  const [isProcessing, setIsProcessing] = useState(false);
  const [tecladoAbierto, setTecladoAbierto] = useState(false); // se abre automáticamente al hacer clic en los inputs en móvil
  const getIsMobile = () => {
    if (typeof window === "undefined") return false;
    const isSmall = window.innerWidth < 768;
    const isTouch = "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
    return isSmall || isMobileUA || (isTouch && window.innerWidth < 1024);
  };

  const [isMobile, setIsMobile] = useState(getIsMobile);
  const inputRefs = React.useRef({});

  useEffect(() => {
    // Desenfocar cualquier elemento activo (como el buscador de productos) para que no persista el teclado nativo del móvil
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const set1 = (m, v) => {
    const val = Math.max(0, Math.min(parseInt(v, 10) || 0, 999999999));
    setMontos(x => ({ ...x, [m]: val }));
  };

  const noEfectivo = (montos.Transferencia || 0) + (montos.Nequi || 0) + (montos.Daviplata || 0); // medios exactos
  const restoEfectivo = Math.max(0, total - noEfectivo);                                          // falta cubrir en efectivo
  const efectivoAplicado = Math.min(montos.Efectivo || 0, restoEfectivo);
  const restante = Math.max(0, total - noEfectivo - efectivoAplicado);
  const cambio = Math.max(0, (montos.Efectivo || 0) - restoEfectivo);
  const excede = noEfectivo > total;                                                              // medios exactos no pueden sobrepagar
  const cubierto = restante === 0 && !excede;
  const totalRecibido = noEfectivo + (montos.Efectivo || 0);

  // Operaciones del teclado numérico
  const handleDigit = (d) => {
    const cur = montos[activo] || 0;
    const s = cur === 0 ? String(d) : String(cur) + String(d);
    if (s.length <= 10) {
      set1(activo, parseInt(s, 10) || 0);
    }
  };

  const handleDoubleZero = () => {
    const cur = montos[activo] || 0;
    if (cur > 0) {
      const s = String(cur) + "00";
      if (s.length <= 10) set1(activo, parseInt(s, 10) || 0);
    }
  };

  const handleTripleZero = () => {
    const cur = montos[activo] || 0;
    if (cur > 0) {
      const s = String(cur) + "000";
      if (s.length <= 10) set1(activo, parseInt(s, 10) || 0);
    }
  };

  const handleDecimal = () => {
    // Los precios en COP son enteros sin decimales; mantenemos formato limpio
  };

  const handleBackspace = () => {
    const cur = montos[activo] || 0;
    const s = String(cur);
    if (s.length > 1) {
      set1(activo, parseInt(s.slice(0, -1), 10) || 0);
    } else {
      set1(activo, 0);
    }
  };

  const handleClear = () => {
    set1(activo, 0);
  };

  const handleCompletar = (targetMetodo) => {
    const target = targetMetodo || activo;
    const otros = ["Efectivo", "Transferencia", "Nequi", "Daviplata"].reduce(
      (s, k) => (k === target ? s : s + (montos[k] || 0)),
      0
    );
    set1(target, Math.max(0, total - otros));
    setActivo(target);
  };

  const handleQuickBill = (amount) => {
    set1(activo, amount);
  };

  const confirmar = () => {
    if (!cubierto || isProcessing) return;
    setIsProcessing(true);
    try {
      const pagos = [];
      ["Transferencia", "Nequi", "Daviplata"].forEach(m => {
        if ((montos[m] || 0) > 0) pagos.push({ metodo: m, monto: montos[m] });
      });
      if (efectivoAplicado > 0) pagos.push({ metodo: "Efectivo", monto: efectivoAplicado });
      const metodo = pagos.length === 1 ? pagos[0].metodo : (pagos.length === 0 ? "Efectivo" : "Mixto");
      onPay({
        metodo,
        pagos,
        recibido: noEfectivo + (montos.Efectivo || 0),
        cambio,
      });
    } catch (err) {
      console.error("Error al procesar el pago:", err);
      setIsProcessing(false);
    }
  };

  // Soporte de teclado físico (0-9, Backspace, C, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (cubierto && !isProcessing) {
          confirmar();
        }
        return;
      }

      // Si no estamos dentro del campo nativo de texto, el teclado numérico visual recibe las teclas
      if (!isInput) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleDigit(e.key);
        } else if (e.key === "Backspace") {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === "c" || e.key === "C" || e.key === "Delete") {
          e.preventDefault();
          handleClear();
        } else if (e.key === "." || e.key === ",") {
          e.preventDefault();
          handleDecimal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activo, montos, cubierto, isProcessing, total]);

  const activeMeta = METODOS_PAGO.find(x => x.id === activo) || METODOS_PAGO[0];

  return (
    <div className="modal-bg">
      <div className="modal modal-payment bottom-sheet" onClick={e => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="modal-h payment-modal-header tw-flex tw-items-center tw-justify-between tw-py-2.5 tw-px-4 sm:tw-px-5 tw-border-b tw-border-border">
          <h3 className="payment-modal-title tw-m-0 tw-text-base tw-font-bold tw-tracking-wider">
            COBRAR VENTA
          </h3>
          <button className="payment-modal-close-btn x tw-w-8 tw-h-8 tw-rounded-lg tw-grid tw-place-items-center hover:tw-bg-surface-2 tw-transition-colors" onClick={onClose} title="Cerrar (Esc)">
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-b tw-p-3.5 sm:tw-p-4 tw-overflow-y-auto">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-3 sm:tw-gap-3.5">
            {/* Columna Izquierda: Resumen, Selector de Medios y Estado */}
            <div className="md:tw-col-span-7 tw-flex tw-flex-col tw-gap-2.5">
              {/* Tarjeta de Total a Pagar */}
              <div className="tw-bg-gradient-to-r tw-from-surface-2 tw-to-surface tw-border tw-border-border tw-rounded-xl tw-p-2.5 tw-px-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-0.5">
                  <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-txt-3">Total a cobrar</span>
                  <span className="tw-text-[10px] tw-text-txt-2 tw-bg-surface-3/50 tw-px-2 tw-py-0.2 tw-rounded-md mono">
                    Ticket actual
                  </span>
                </div>
                <div className="tw-flex tw-items-baseline tw-justify-between">
                  <div className="mono tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-txt">
                    {window.fmtCOP(total)}
                  </div>
                  <div className="tw-text-[11px] tw-text-txt-3 mono">
                    {items} {items === 1 ? "producto" : "productos"}
                  </div>
                </div>
              </div>

              {/* Lista de Medios de Pago */}
              <div className="tw-flex tw-flex-col tw-gap-1.5">
                <div className="tw-flex tw-items-center tw-justify-between tw-px-0.5">
                  <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-txt-3">
                    Reparte el pago entre los medios
                  </span>
                  <span className="tw-text-[10px] tw-text-txt-3 tw-hidden sm:tw-inline">
                    Haz clic para ingresar el valor
                  </span>
                </div>

                {METODOS_PAGO.map(m => {
                  const isAct = activo === m.id;
                  const val = montos[m.id] || 0;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (document.activeElement && typeof document.activeElement.blur === "function") {
                          document.activeElement.blur();
                        }
                        setActivo(m.id);
                        setTecladoAbierto(true);
                        if (!getIsMobile() && inputRefs.current[m.id]) {
                          inputRefs.current[m.id].focus();
                        }
                      }}
                      className={`payment-method-card tw-py-2 tw-px-2.5 sm:tw-px-3 tw-flex tw-items-center tw-gap-2.5 ${isAct ? "is-active" : ""}`}
                    >
                      {/* Icono del medio */}
                      <div
                        className="tw-w-8 tw-h-8 tw-rounded-lg tw-grid tw-place-items-center tw-shrink-0 tw-transition-colors"
                        style={{
                          background: isAct ? "var(--accent)" : "var(--surface-2)",
                          color: isAct ? "#fff" : m.color,
                        }}
                      >
                        <Icon name={m.icon} size={16}/>
                      </div>

                      {/* Nombre y descripción */}
                      <div className="tw-flex-1 tw-min-w-0">
                        <div className="tw-flex tw-items-center tw-gap-1.5">
                          <span className="tw-text-xs tw-font-semibold tw-text-txt tw-whitespace-nowrap">{m.label}</span>
                          {isAct && (
                            <span className="tw-text-[9px] tw-font-bold tw-bg-accent tw-text-white tw-px-1.5 tw-py-0.2 tw-rounded-full tw-whitespace-nowrap tw-shrink-0">
                              Editando
                            </span>
                          )}
                        </div>
                        <div className="tw-text-[10px] tw-text-txt-3 tw-truncate">{m.sub}</div>
                      </div>

                      {/* Monto: Visor táctil en móvil (sin input nativo) vs Input editable en desktop */}
                      <div className="tw-flex tw-items-center tw-gap-1.5 tw-shrink-0">
                        {/* 1. MÓVIL (md:tw-hidden): Visor táctil 100% libre de teclado nativo del celular */}
                        <div
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (document.activeElement && typeof document.activeElement.blur === "function") {
                              document.activeElement.blur();
                            }
                            setActivo(m.id);
                            setTecladoAbierto(true);
                          }}
                          className={`mono tw-relative tw-w-28 sm:tw-w-32 tw-border tw-rounded-lg tw-pl-6 tw-pr-2.5 tw-py-1.5 tw-text-right tw-text-sm tw-font-semibold tw-bg-surface tw-text-txt tw-select-none tw-cursor-pointer md:tw-hidden tw-transition-all ${
                            isAct
                              ? "tw-border-accent tw-ring-2 tw-ring-accent/30"
                              : "tw-border-border"
                          }`}
                        >
                          <span className="tw-absolute tw-left-2.5 tw-top-1/2 tw--translate-y-1/2 tw-text-xs tw-font-semibold tw-text-txt-3 pointer-events-none select-none">
                            $
                          </span>
                          <span className={val ? "tw-text-txt" : "tw-text-txt-3"}>
                            {val ? val.toLocaleString("es-CO") : "0"}
                          </span>
                        </div>

                        {/* 2. ESCRITORIO (tw-hidden md:tw-block): Input real para teclado físico de computadores */}
                        <div className="tw-relative tw-w-32 tw-hidden md:tw-block">
                          <span className="tw-absolute tw-left-2.5 tw-top-1/2 tw--translate-y-1/2 tw-text-xs tw-font-semibold tw-text-txt-3 pointer-events-none select-none">
                            $
                          </span>
                          <input
                            id={`input-pago-desktop-${m.id}`}
                            ref={el => { inputRefs.current[m.id] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            className="mono tw-w-full tw-border tw-border-border tw-rounded-lg tw-pl-5 tw-pr-2 tw-py-1 tw-text-right tw-text-xs sm:tw-text-sm tw-font-semibold tw-bg-surface tw-text-txt focus:tw-outline-none"
                            placeholder="0"
                            style={
                              isAct
                                ? {
                                    borderColor: "var(--accent)",
                                    boxShadow: "0 0 0 2px color-mix(in oklab, var(--accent) 35%, transparent)",
                                  }
                                : undefined
                            }
                            value={val ? val.toLocaleString("es-CO") : ""}
                            onFocus={e => {
                              setActivo(m.id);
                              e.target.select();
                            }}
                            onClick={() => setActivo(m.id)}
                            onChange={e => set1(m.id, parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Atajos de Billetes en Móvil (conserva la opción de escoger el valor del billete) */}
              <div className="md:tw-hidden tw-flex tw-flex-col tw-gap-1.5 tw-p-2.5 tw-rounded-xl tw-bg-surface-2 tw-border tw-border-border">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-txt-3">
                    Billetes para <span className="tw-text-accent tw-font-semibold">{activo}</span>
                  </span>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <button
                      type="button"
                      onClick={() => setTecladoAbierto(true)}
                      className="tw-text-accent tw-text-[11px] tw-font-bold hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0 tw-flex tw-items-center tw-gap-1"
                    >
                      <Icon name="calculator" size={13}/> Teclado táctil
                    </button>
                    {(montos[activo] || 0) > 0 && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="tw-text-bad tw-text-[10px] tw-font-semibold hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCompletar(activo)}
                    className="payment-shortcut-pill tw-py-1.5 tw-px-3 tw-bg-accent-soft tw-text-accent tw-border-accent/40 tw-font-bold hover:tw-bg-accent hover:tw-text-white"
                    title="Fijar exactamente el valor restante a pagar"
                  >
                    Completar
                  </button>
                  {[10000, 20000, 50000, 100000].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleQuickBill(v)}
                      className="payment-shortcut-pill tw-py-1.5 tw-px-2.5"
                    >
                      ${v.toLocaleString("es-CO")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indicador de Estado en Vivo (Restante, Cambio, Exceso) */}
              <div className="tw-mt-1 md:tw-mt-auto">
                {excede ? (
                  <div className="tw-p-2.5 tw-rounded-xl tw-border tw-border-bad/30 tw-bg-bad-soft tw-flex tw-items-start tw-gap-2">
                    <span className="tw-text-bad tw-shrink-0 tw-mt-0.5"><Icon name="alert" size={15}/></span>
                    <div>
                      <div className="tw-text-xs tw-font-bold tw-text-bad">Transferencias exceden el total</div>
                      <div className="tw-text-[10.5px] tw-text-bad/90 tw-mt-0.5">
                        Los medios electrónicos deben ser exactos. Solo el efectivo permite recibir más dinero y dar cambio.
                      </div>
                    </div>
                  </div>
                ) : restante > 0 ? (
                  <div className="tw-p-2.5 sm:tw-p-3 tw-rounded-xl tw-border tw-border-bad/30 tw-bg-bad-soft/40 tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-bad">
                      <Icon name="clock" size={15}/>
                      <span className="tw-text-xs tw-font-bold">Saldo restante por pagar:</span>
                    </div>
                    <span className="mono tw-text-base md:tw-text-lg tw-font-extrabold tw-text-bad">
                      {window.fmtCOP(restante)}
                    </span>
                  </div>
                ) : cambio > 0 ? (
                  <div className="tw-p-2.5 sm:tw-p-3 tw-rounded-xl tw-border tw-border-good/40 tw-bg-good-soft/70 tw-flex tw-flex-col tw-gap-1 tw-shadow-sm">
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-text-good">
                        <Icon name="coins" size={16}/>
                        <span className="tw-text-xs md:tw-text-sm tw-font-extrabold tw-uppercase tw-tracking-wide">
                          Cambio a devolver al cliente:
                        </span>
                      </div>
                      <span className="mono tw-text-lg md:tw-text-xl tw-font-black tw-text-good">
                        {window.fmtCOP(cambio)}
                      </span>
                    </div>
                    <div className="tw-flex tw-items-center tw-justify-between tw-pt-1 tw-border-t tw-border-good/20 tw-text-[10.5px] tw-text-good">
                      <span>Total recibido: <b>{window.fmtCOP(totalRecibido)}</b></span>
                      <span>Total venta: <b>{window.fmtCOP(total)}</b></span>
                    </div>
                  </div>
                ) : (
                  <div className="tw-p-2.5 sm:tw-p-3 tw-rounded-xl tw-border tw-border-good/40 tw-bg-good-soft/60 tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-good">
                      <Icon name="checkCircle" size={16}/>
                      <div>
                        <div className="tw-text-xs tw-font-bold">Pago exacto cubierto</div>
                        <div className="tw-text-[10px] tw-text-good/80">No hay cambio pendiente por entregar</div>
                      </div>
                    </div>
                    <span className="mono tw-text-base tw-font-bold tw-text-good">
                      {window.fmtCOP(total)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Teclado Numérico y Atajos de Billetes (solo visible en pantallas md+) */}
            <div className="tw-hidden md:tw-flex md:tw-col-span-5 tw-flex-col tw-gap-2 tw-bg-surface-2 tw-p-2.5 sm:tw-p-3 tw-rounded-xl tw-border tw-border-border">
              {/* Atajos de Billetes */}
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <span className="tw-text-[9.5px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-txt-3">
                    Atajos rápidos ({activo})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCompletar(activo)}
                    className="tw-text-accent tw-text-[10px] tw-font-bold hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0"
                    title="Fijar exactamente el valor restante a pagar"
                  >
                    ⚡ Completar
                  </button>
                </div>
                <div className="tw-grid tw-grid-cols-4 tw-gap-1">
                  {[10000, 20000, 50000, 100000].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleQuickBill(v)}
                      className="payment-shortcut-pill tw-py-1 tw-px-0.5 tw-text-center tw-text-[10.5px] tw-font-bold"
                    >
                      ${v.toLocaleString("es-CO")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botonera del Teclado Numérico */}
              <div className="tw-grid tw-grid-cols-3 tw-gap-1.5">
                {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="payment-keypad-btn tw-h-[38px] tw-text-base tw-font-bold"
                  >
                    {d}
                  </button>
                ))}

                {/* Fila 4: C, 0, Backspace */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="payment-keypad-btn action-clear tw-h-[38px] tw-text-base tw-font-bold"
                  title="Limpiar valor (C)"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit("0")}
                  className="payment-keypad-btn tw-h-[38px] tw-text-base tw-font-bold"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="payment-keypad-btn action-backspace tw-h-[38px]"
                  title="Borrar último dígito (Backspace)"
                >
                  <Icon name="backspace" size={17}/>
                </button>

                {/* Fila 5: 00, 000, . (Dimensiones 100% uniformes) */}
                <button
                  type="button"
                  onClick={handleDoubleZero}
                  className="payment-keypad-btn tw-h-[38px] tw-text-sm tw-font-bold"
                  title="Agregar 00"
                >
                  00
                </button>
                <button
                  type="button"
                  onClick={handleTripleZero}
                  className="payment-keypad-btn tw-h-[38px] tw-text-sm tw-font-bold"
                  title="Agregar 000 (miles)"
                >
                  000
                </button>
                <button
                  type="button"
                  onClick={handleDecimal}
                  className="payment-keypad-btn tw-h-[38px] tw-text-base tw-font-bold"
                  title="Separador decimal"
                >
                  .
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="modal-f tw-flex tw-items-center tw-justify-between tw-py-2.5 tw-px-4 sm:tw-px-5 tw-border-t tw-border-border tw-bg-surface-2">
          <button
            type="button"
            className="btn ghost tw-px-3.5 tw-py-1.5 tw-text-sm tw-font-medium"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-confirmar-pago"
            className={`btn accent tw-px-5 tw-py-2 tw-text-sm tw-font-bold tw-flex tw-items-center tw-gap-2 tw-shadow-md tw-transition-all ${
              cubierto && !isProcessing
                ? "tw-scale-100 hover:tw-brightness-110 active:tw-scale-[0.98]"
                : "tw-opacity-50 tw-cursor-not-allowed"
            }`}
            disabled={!cubierto || isProcessing}
            onClick={confirmar}
          >
            {isProcessing ? (
              <>
                <span className="dot tw-animate-ping"/>
                <span>Procesando pago...</span>
              </>
            ) : cubierto ? (
              <>
                <Icon name="checkCircle" size={17}/>
                <span>Confirmar pago ({window.fmtCOP(total)})</span>
              </>
            ) : (
              <>
                <Icon name="check" size={16}/>
                <span>Faltan {window.fmtCOP(restante)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Teclado Numérico Flotante / Drawer para Móvil (se abre automáticamente al hacer clic en cualquiera de los inputs) */}
      {isMobile && tecladoAbierto && (
        <div
          className="md:tw-hidden tw-fixed tw-inset-0 tw-z-[120] tw-flex tw-flex-col tw-justify-end"
          onClick={() => setTecladoAbierto(false)}
        >
          {/* Fondo semi-transparente */}
          <div className="tw-absolute tw-inset-0 tw-bg-black/40 tw-backdrop-blur-[1px] tw-transition-opacity" />

          {/* Cajón táctil deslizable */}
          <div
            className="payment-mobile-drawer tw-relative tw-z-10 tw-w-full tw-max-w-md tw-mx-auto tw-p-3.5 sm:tw-p-4 tw-flex tw-flex-col tw-gap-2.5"
            onClick={e => e.stopPropagation()}
          >
            {/* Manija táctil superior */}
            <div className="tw-w-10 tw-h-1 tw-bg-border-strong tw-rounded-full tw-mx-auto tw--mt-1 tw-mb-0.5 tw-opacity-60" />

            {/* Selector de Medios de Pago rápidos */}
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-overflow-x-auto no-scrollbar tw-pb-0.5">
              {METODOS_PAGO.map(m => {
                const isAct = activo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActivo(m.id)}
                    className={`tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-lg tw-text-xs tw-font-semibold tw-border tw-transition-all tw-shrink-0 ${
                      isAct
                        ? "tw-bg-accent tw-text-white tw-border-accent tw-shadow-sm"
                        : "tw-bg-surface tw-text-txt-2 tw-border-border hover:tw-bg-surface-2"
                    }`}
                  >
                    <span
                      className="tw-w-2 tw-h-2 tw-rounded-full"
                      style={{ background: isAct ? "#fff" : m.color }}
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Visor digital del monto activo y botón Listo */}
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-bg-surface tw-p-2.5 tw-rounded-xl tw-border tw-border-border tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                <div
                  className="tw-w-8 tw-h-8 tw-rounded-lg tw-grid tw-place-items-center tw-shrink-0 tw-text-white tw-text-xs"
                  style={{ background: activeMeta.color }}
                >
                  <Icon name={activeMeta.icon} size={16}/>
                </div>
                <div className="tw-min-w-0">
                  <div className="tw-text-[10px] tw-font-bold tw-text-txt-3 tw-uppercase tw-tracking-wide">
                    Monto {activeMeta.label}
                  </div>
                  <div className="mono tw-text-xl tw-font-extrabold tw-text-txt tw-leading-tight">
                    ${(montos[activo] || 0).toLocaleString("es-CO")}
                  </div>
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
                {(montos[activo] || 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="tw-text-bad tw-text-xs tw-font-bold tw-px-2 tw-py-1 tw-rounded-lg hover:tw-bg-bad-soft tw-transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTecladoAbierto(false)}
                  className="tw-bg-accent tw-text-white tw-text-xs tw-font-bold tw-px-3.5 tw-py-1.5 tw-rounded-lg tw-shadow-sm hover:tw-brightness-110 active:tw-scale-95 tw-transition-all tw-flex tw-items-center tw-gap-1"
                >
                  <Icon name="check" size={13}/>
                  <span>Listo</span>
                </button>
              </div>
            </div>

            {/* Atajos de Billetes en el teclado */}
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-overflow-x-auto no-scrollbar tw-py-0.5">
              <button
                type="button"
                onClick={() => handleCompletar(activo)}
                className="payment-shortcut-pill tw-py-1.5 tw-px-3 tw-bg-accent-soft tw-text-accent tw-border-accent/40 tw-font-bold hover:tw-bg-accent hover:tw-text-white tw-shrink-0 tw-text-xs"
                title="Fijar exactamente el valor restante a pagar"
              >
                Completar
              </button>
              {[10000, 20000, 50000, 100000].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickBill(v)}
                  className="payment-shortcut-pill tw-py-1.5 tw-px-2.5 tw-shrink-0 tw-text-xs"
                >
                  ${v.toLocaleString("es-CO")}
                </button>
              ))}
            </div>

            {/* Teclado numérico idéntico a la imagen (5 filas x 3 columnas) */}
            <div className="tw-grid tw-grid-cols-3 tw-gap-2">
              {/* Fila 1: 7, 8, 9 */}
              {["7", "8", "9"].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-xl tw-font-bold"
                >
                  {d}
                </button>
              ))}

              {/* Fila 2: 4, 5, 6 */}
              {["4", "5", "6"].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-xl tw-font-bold"
                >
                  {d}
                </button>
              ))}

              {/* Fila 3: 1, 2, 3 */}
              {["1", "2", "3"].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-xl tw-font-bold"
                >
                  {d}
                </button>
              ))}

              {/* Fila 4: C, 0, ⌫ */}
              <button
                type="button"
                onClick={handleClear}
                className="payment-keypad-btn action-clear tw-h-12 sm:tw-h-13 tw-text-lg tw-font-bold"
                title="Limpiar valor (C)"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleDigit("0")}
                className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-xl tw-font-bold"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="payment-keypad-btn action-backspace tw-h-12 sm:tw-h-13"
                title="Borrar último dígito (Backspace)"
              >
                <Icon name="backspace" size={20}/>
              </button>

              {/* Fila 5: 00, 000, . */}
              <button
                type="button"
                onClick={handleDoubleZero}
                className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-sm tw-font-bold"
                title="Agregar 00"
              >
                00
              </button>
              <button
                type="button"
                onClick={handleTripleZero}
                className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-sm tw-font-bold"
                title="Agregar 000 (miles)"
              >
                000
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                className="payment-keypad-btn tw-h-12 sm:tw-h-13 tw-text-lg tw-font-bold"
                title="Punto decimal"
              >
                .
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =================== Imprimir recibo 80mm ===================
// Escapa texto para interpolarlo de forma segura en el HTML del recibo.
// (Sin este helper, printReceipt lanzaba "_escHtml is not defined" y el
//  botón Imprimir fallaba en silencio: no hacía nada.)
const _escHtml = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const printReceipt = (factura) => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  const nombre = _escHtml(cfg.tienda_nombre || "Mi Tienda");
  const nit = _escHtml(cfg.tienda_nit || "");
  const dir = _escHtml(cfg.tienda_direccion || "");
  const tel = _escHtml(cfg.tienda_telefono || "");
  const correo = _escHtml(cfg.tienda_correo || "");
  const footer = _escHtml(cfg.tienda_footer || "¡Gracias por tu compra!");
  // Ancho de tirilla: 80mm (default) o 58mm. Configurable desde cfg.recibo_ancho_mm.
  const anchoMm = parseInt(cfg.recibo_ancho_mm) === 58 ? 58 : 80;
  const bodyMm = anchoMm - 8;

  const lineas = factura.items.map(l =>
    `<tr><td colspan="3" style="padding:1px 0 0">${_escHtml(l.nombre)}</td></tr>
     <tr>
       <td style="padding:0 0 1px 8px">${l.q} x $${l.precio.toLocaleString("es-CO")}</td>
       <td></td>
       <td style="text-align:right">$${(l.q * l.precio).toLocaleString("es-CO")}</td>
     </tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Recibo ${factura.id}</title>
<style>
  @page { size: ${anchoMm}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: ${bodyMm}mm; margin: 0 auto; padding: 4mm 0; color: #000; }
  .center { text-align: center; }
  h2 { font-size: 14px; margin-bottom: 2px; }
  .info { font-size: 11px; margin-bottom: 1px; }
  hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .total-row td { font-weight: bold; font-size: 13px; padding-top: 2px; }
  .right { text-align: right; }
  .footer { margin-top: 6px; font-size: 11px; }
</style></head><body>
  <div class="center"><h2>${nombre}</h2></div>
  ${nit ? `<div class="center info">NIT ${nit}</div>` : ""}
  ${dir ? `<div class="center info">${dir}</div>` : ""}
  ${tel ? `<div class="center info">Tel: ${tel}</div>` : ""}
  ${correo ? `<div class="center info">${correo}</div>` : ""}
  <div class="center info">${factura.caja || ""}</div>
  <div class="center info">${factura.fecha} ${factura.hora}</div>
  <hr/>
  <table>
    <tr><td>Factura</td><td></td><td class="right">${_escHtml(factura.id)}</td></tr>
    <tr><td>Cajero</td><td></td><td class="right">${_escHtml(factura.cajero)}</td></tr>
  </table>
  <hr/>
  <table>${lineas}</table>
  <hr/>
  <table>
    <tr class="total-row"><td>TOTAL</td><td></td><td class="right">$${factura.total.toLocaleString("es-CO")}</td></tr>
    <tr><td>${factura.metodo}</td><td></td><td class="right">$${factura.recibido.toLocaleString("es-CO")}</td></tr>
    ${factura.cambio > 0 ? `<tr><td>Cambio</td><td></td><td class="right">$${factura.cambio.toLocaleString("es-CO")}</td></tr>` : ""}
  </table>
  <hr/>
  <div class="center footer">${footer}</div>
</body></html>`;

  // Imprime vía un iframe oculto (más confiable que window.open; el bloqueador no lo tumba).
  // El usuario elige la impresora POS en el diálogo de Windows; o sale directo si Chrome
  // se abre con --kiosk-printing y la POS está como impresora predeterminada.
  const prev = document.getElementById("receipt-print-frame");
  if (prev) prev.remove();
  const frame = document.createElement("iframe");
  frame.id = "receipt-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed; left:-9999px; top:0; width:0; height:0; border:0;";
  document.body.appendChild(frame);

  const fw = frame.contentWindow;
  const cleanup = () => { try { frame.remove(); } catch (e) {} };
  fw.onafterprint = () => setTimeout(cleanup, 100);

  const fdoc = fw.document;
  fdoc.open(); fdoc.write(html); fdoc.close();

  // Pequeña espera para que el contenido se renderice antes de imprimir
  setTimeout(() => {
    try { fw.focus(); fw.print(); }
    catch (e) { console.error("printReceipt:", e); cleanup(); }
  }, 200);
  // Respaldo: limpiar el iframe pase lo que pase
  setTimeout(cleanup, 60000);
};

// =================== Recibo ===================
const ReceiptModal = ({ factura, onClose }) => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  return (
  <Modal title="Venta completada" onClose={onClose} bottomSheet footer={
    <>
      <button className="btn" onClick={() => printReceipt(factura)}><Icon name="print"/> Imprimir</button>
      <button className="btn primary" onClick={onClose}>Nueva venta <Icon name="arrowRight"/></button>
    </>
  }>
    <div className="receipt">
      <h4>{cfg.tienda_nombre || "Mi Tienda"}</h4>
      <div className="center">{cfg.tienda_nit ? `NIT ${cfg.tienda_nit} · ` : ""}{factura.caja}</div>
      {cfg.tienda_direccion && <div className="center">{cfg.tienda_direccion}</div>}
      {cfg.tienda_telefono && <div className="center">Tel: {cfg.tienda_telefono}</div>}
      {cfg.tienda_correo && <div className="center">{cfg.tienda_correo}</div>}
      <div className="center">{factura.fecha} {factura.hora}</div>
      <hr/>
      <div className="line"><span>Factura</span><span>{factura.id}</span></div>
      <div className="line"><span>Cajero</span><span>{factura.cajero}</span></div>
      <hr/>
      {factura.items.map(l => (
        <React.Fragment key={l.sku}>
          <div className="line"><span>{l.nombre}</span><span></span></div>
          <div className="line">
            <span style={{ paddingLeft: 8 }}>{l.q} × ${l.precio.toLocaleString("es-CO")}</span>
            <span>${(l.q * l.precio).toLocaleString("es-CO")}</span>
          </div>
        </React.Fragment>
      ))}
      <hr/>
      <div className="line"><span>TOTAL</span><span>${factura.total.toLocaleString("es-CO")}</span></div>
      <div className="line"><span>{factura.metodo}</span><span>${factura.recibido.toLocaleString("es-CO")}</span></div>
      {factura.cambio > 0 && <div className="line"><span>Cambio</span><span>${factura.cambio.toLocaleString("es-CO")}</span></div>}
      <hr/>
      <div className="center">{cfg.tienda_footer || "¡Gracias por tu compra!"}</div>
    </div>
  </Modal>
  );
};

// =================== Cierre de turno ===================
const CloseShiftModal = ({ shift, stats, onClose, onConfirm, saving }) => {
  const pm = stats.porMetodo || { Efectivo: 0, Transferencia: 0, Nequi: 0, Daviplata: 0 };
  const esperado = (shift.base || 0) + (pm.Efectivo || 0);   // efectivo esperado = base + ventas en efectivo
  const [contado, setContado] = useState("");   // vacío: el cajero DEBE contar y escribir
  const [observaciones, setObservaciones] = useState("");
  const sinContar = contado === "";
  const contadoNum = sinContar ? 0 : (parseInt(contado, 10) || 0);
  const diff = contadoNum - esperado;

  const diffBg = sinContar ? "var(--surface-2)" : diff === 0 ? "var(--good-soft)" : (diff > 0 ? "var(--warn-soft)" : "var(--bad-soft)");
  const diffColor = sinContar ? "var(--text-3)" : diff === 0 ? "var(--good)" : (diff > 0 ? "var(--warn)" : "var(--bad)");
  const diffMsg = sinContar ? "Cuenta el efectivo para ver la diferencia." : diff === 0 ? "Caja cuadra perfectamente." : diff > 0 ? "Sobrante en caja — revisar." : "Faltante — debe justificarse.";

  return (
    <Modal title="Cerrar turno" lg bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={sinContar || saving} onClick={() => onConfirm({ efectivoContado: contadoNum, observaciones })}><Icon name="check"/> {saving ? "Cerrando…" : "Confirmar cierre"}</button>
      </>
    }>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 sm:tw-gap-5">
            <div>
              <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider tw-mb-2">Resumen del turno</div>
              <div className="card tw-bg-surface-2">
                <div className="card-b">
                  <div className="row spaced"><span className="muted">Base inicial</span><span className="mono">{window.fmtCOP(shift.base)}</span></div>
                  <div className="row spaced"><span className="muted">Efectivo</span><span className="mono">{window.fmtCOP(pm.Efectivo)}</span></div>
                  <div className="row spaced"><span className="muted">Transferencia</span><span className="mono">{window.fmtCOP(pm.Transferencia)}</span></div>
                  <div className="row spaced"><span className="muted">Nequi</span><span className="mono">{window.fmtCOP(pm.Nequi)}</span></div>
                  <div className="row spaced"><span className="muted">Daviplata</span><span className="mono">{window.fmtCOP(pm.Daviplata)}</span></div>
                  <div className="row spaced"><span className="muted">Transacciones</span><span className="mono">{stats.trans}</span></div>
                  <hr className="tw-border-0 tw-border-t tw-border-border tw-my-2.5"/>
                  <div className="row spaced"><span className="tw-font-semibold">Esperado en caja (efectivo)</span><span className="mono tw-font-semibold tw-text-[17px]">{window.fmtCOP(esperado)}</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="field">
                <label>Efectivo contado físicamente</label>
                <input className="mono" placeholder="Cuenta el efectivo…" value={sinContar ? "" : contadoNum.toLocaleString("es-CO")} onChange={e => setContado(e.target.value.replace(/\D/g,""))}/>
              </div>
              <div className="card" style={{ background: diffBg }}>
                <div className="card-b">
                  <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider">Diferencia</div>
                  <div className="mono tw-text-[22px] tw-font-semibold tw-mt-1">{sinContar ? "—" : (diff > 0 ? "+" : "") + window.fmtCOP(diff)}</div>
                  <div className="tw-text-xs tw-mt-1">{diffMsg}</div>
                </div>
              </div>
              <div className="field tw-mt-2">
                <label>Observaciones (opcional)</label>
                <textarea rows="3" placeholder="Ej: cliente recibió mal el cambio…" value={observaciones} onChange={e => setObservaciones(e.target.value)}/>
              </div>
            </div>
          </div>
    </Modal>
  );
};

// =================== Resultado de cierre ===================
const ShiftClosed = ({ summary, onLogout }) => (
  <div className="tw-min-h-screen tw-grid tw-place-items-center tw-p-6 tw-bg-bg">
    <div className="card tw-w-[min(94vw,480px)]">
      <div className="card-b tw-text-center tw-p-8">
        <div className="tw-w-14 tw-h-14 tw-rounded-full tw-bg-good-soft tw-text-good tw-mx-auto tw-mb-3.5 tw-grid tw-place-items-center">
          <Icon name="check" size={28}/>
        </div>
        <h2 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-tracking-tight">Turno cerrado</h2>
        <p className="muted">Total facturado en este turno</p>
        <div className="mono tw-text-4xl tw-font-semibold tw-tracking-tight">{window.fmtCOP(summary.ventas)}</div>
        <div className="muted tw-text-[13px]">{summary.trans} ventas · {summary.items} productos</div>
        <button className="btn primary full lg tw-mt-4" onClick={onLogout}>
          <Icon name="logout" size={16}/> Cerrar sesión
        </button>
      </div>
    </div>
  </div>
);

Object.assign(window, { ShiftOpen, POS, ShiftClosed });
