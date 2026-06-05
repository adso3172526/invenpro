// Flujo del cajero: apertura de turno → POS → cierre
const { useState, useEffect, useMemo } = React;

// =================== Apertura de turno ===================
const ShiftOpen = ({ cajero, onOpen, onLogout }) => {
  const [base, setBase] = useState(200000);
  const [caja, setCaja] = useState("Caja 01");
  return (
    <div className="shift-open-shell">
      <div className="card shift-open-card tw-w-[min(94vw,480px)]">
        <div className="card-h tw-flex-col tw-items-start tw-p-5">
          <div className="row tw-mb-1.5">
            <img src="logo.png" alt="InvenPro" className="tw-h-[26px] tw-object-contain"/>
          </div>
          <h3 className="tw-text-xl tw-font-semibold tw-tracking-tight tw-my-1">Abrir turno</h3>
          <p className="muted tw-m-0 tw-text-[13px]">Hola {cajero.nombre}. Confirma la base de caja inicial para empezar a facturar.</p>
        </div>
        <div className="card-b tw-p-5">
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
            <div className="field">
              <label>Cajero</label>
              <input value={cajero.nombre} readOnly/>
            </div>
            <div className="field">
              <label>Fecha y hora</label>
              <input value="08 may 2026 · 07:02" readOnly/>
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
        <div className="modal-f tw-bg-surface-2">
          <button className="btn primary" onClick={() => onOpen({ base, caja, ini: new Date() })}>Abrir turno <Icon name="arrowRight"/></button>
          <button className="btn ghost" onClick={onLogout}><Icon name="logout"/> Salir</button>
        </div>
      </div>
    </div>
  );
};

// =================== Escáner de código de barras ===================
const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = React.useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        scanner.stop().catch(() => {});
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(decodedText);
      },
      () => {}
    ).catch(() => setError("No se pudo acceder a la cámara"));

    return () => { scanner.stop().catch(() => {}); };
  }, []);

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[102] tw-bg-black tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-bg-black/80">
        <button className="tw-bg-transparent tw-border-0 tw-text-white tw-cursor-pointer tw-p-1" onClick={onClose}>
          <Icon name="arrowRight" size={20} style={{ transform: "rotate(180deg)" }}/>
        </button>
        <span className="tw-text-white tw-font-semibold tw-text-sm">Escanear código</span>
      </div>

      {/* Viewfinder */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-6 tw-gap-6">
        {error ? (
          <div className="tw-text-center tw-text-white tw-flex tw-flex-col tw-gap-4 tw-items-center">
            <Icon name="alert" size={40}/>
            <p className="tw-text-sm tw-opacity-80">{error}</p>
            <button className="tw-bg-white tw-text-black tw-border-0 tw-rounded-xl tw-py-3 tw-px-6 tw-text-sm tw-font-semibold tw-cursor-pointer"
              onClick={onClose}>
              Ingresar manualmente
            </button>
          </div>
        ) : (
          <>
            <div id="barcode-reader" className="tw-w-full tw-max-w-[320px] tw-rounded-2xl tw-overflow-hidden"/>
            <p className="tw-text-white/60 tw-text-xs tw-text-center">Apunta al código de barras del producto</p>
          </>
        )}
      </div>

      {/* Fallback button */}
      {!error && (
        <div className="tw-px-6 tw-pb-8 tw-pt-2">
          <button className="tw-w-full tw-bg-white/10 tw-text-white tw-border tw-border-white/20 tw-rounded-xl tw-py-3 tw-text-sm tw-font-medium tw-cursor-pointer"
            onClick={onClose}>
            Ingresar manualmente
          </button>
        </div>
      )}
    </div>
  );
};

// =================== POS principal ===================
const CATEGORIAS = ["Todos", "Lácteos", "Panadería", "Granos", "Despensa", "Enlatados", "Bebidas", "Frescos", "Aseo"];

const POS = ({ shift, cajero, onCloseShift, onLogout, theme, setTheme }) => {
  const [productos, setProductos] = useState(() => MOCK.productos.map(p => ({ ...p })));
  const [cart, setCart] = useState([]);
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [pay, setPay] = useState(null); // null | 'modal'
  const [done, setDone] = useState(null); // factura cerrada
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [shiftStats, setShiftStats] = useState({ ventas: 0, trans: 0, items: 0 });

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return productos.filter(p =>
      (cat === "Todos" || p.categoria === cat) &&
      (!ql || p.nombre.toLowerCase().includes(ql) || p.sku.toLowerCase().includes(ql) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(ql)))
    );
  }, [productos, cat, q]);
  const pagProd = usePagination(filtered, 12);

  const totals = useMemo(() => {
    const sub = cart.reduce((s, l) => s + l.q * l.precio, 0);
    const iva = Math.round(sub * 0.0); // exento simplificado
    return { sub, iva, total: sub + iva, items: cart.reduce((s, l) => s + l.q, 0) };
  }, [cart]);

  const addToCart = (p) => {
    if (p.stock <= 0) { setToast("Sin stock disponible"); return; }
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

  const handleBarcodeScan = (code) => {
    setScanOpen(false);
    const p = productos.find(x => x.codigoBarras === code)
           || productos.find(x => x.sku === code);
    if (p) { addToCart(p); setToast(`${p.nombre} agregado`); }
    else setToast(`Código "${code}" no encontrado`);
  };

  const completePay = async (metodo, recibido) => {
    // Descontar inventario localmente para UI inmediata
    setProductos(prev => prev.map(p => {
      const l = cart.find(x => x.sku === p.sku);
      return l ? { ...p, stock: Math.max(0, p.stock - l.q) } : p;
    }));
    const factura = {
      id: "F-" + (10310 + shiftStats.trans),
      fecha: window.todayStr,
      hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      cajero: cajero.nombre,
      caja: shift.caja,
      metodo,
      items: [...cart],
      total: totals.total,
      recibido,
      cambio: recibido - totals.total,
    };
    setShiftStats(s => ({ ventas: s.ventas + totals.total, trans: s.trans + 1, items: s.items + totals.items }));
    setDone(factura);
    setPay(null);
    setCart([]);
    // Persistir en Supabase (no bloquea la UI)
    DB.createFactura(factura, factura.items).catch(err => console.error("POS persist:", err));
  };

  const closeShift = () => {
    onCloseShift({ ...shift, ...shiftStats, cierre: new Date() });
  };

  return (
    <div className="tw-h-screen tw-flex tw-flex-col tw-bg-bg tw-overflow-hidden">
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
      <div className="md:tw-hidden tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2.5 tw-bg-surface tw-border-b tw-border-border">
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
      <div className="pos">
        {/* ===== Desktop: estructura original con pos-left ===== */}
        <div className="pos-left tw-hidden md:tw-flex">
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
            {CATEGORIAS.map(c => (
              <button key={c} className={"cat-tab" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="product-grid">
            {pagProd.slice.map(p => (
              <button key={p.sku} className="product" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                <div className="thumb"><Icon name="box" size={22}/></div>
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
                      <button className="tw-bg-transparent tw-border-0 tw-w-6 tw-h-6 tw-grid tw-place-items-center hover:tw-bg-surface-2 tw-cursor-pointer" onClick={() => setQty(l.sku, -1)}><Icon name="minus" size={10}/></button>
                      <span className="tw-px-1.5 tw-tabular-nums tw-text-[11px] tw-font-medium">{l.q}</span>
                      <button className="tw-bg-transparent tw-border-0 tw-w-6 tw-h-6 tw-grid tw-place-items-center hover:tw-bg-surface-2 tw-cursor-pointer" onClick={() => setQty(l.sku, +1)}><Icon name="plus" size={10}/></button>
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
        <div className="tw-flex tw-flex-col md:tw-hidden tw-flex-1 tw-min-h-0 tw-bg-bg">

          {/* Buscador con estilo pill */}
          <div className="tw-px-3 tw-pt-3 tw-pb-2">
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
              <button className="tw-bg-accent tw-text-white tw-border-0 tw-rounded-lg tw-w-8 tw-h-8 tw-grid tw-place-items-center tw-cursor-pointer tw-shrink-0"
                onClick={() => setScanOpen(true)} title="Escanear código">
                <Icon name="scan" size={16}/>
              </button>
            </div>
          </div>

          {/* Categorías — pills horizontales */}
          <div className="tw-px-3 tw-pb-2">
            <div className="tw-flex tw-gap-1.5 tw-overflow-x-auto tw-pb-0.5" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              {CATEGORIAS.map(c => (
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
          <div className="tw-flex-1 tw-overflow-y-auto tw-px-3 tw-pb-3 tw-min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="tw-grid tw-grid-cols-2 min-[400px]:tw-grid-cols-3 tw-gap-2">
              {pagProd.slice.map(p => {
                const inCart = cart.find(l => l.sku === p.sku);
                return (
                  <button key={p.sku}
                    className={"tw-relative tw-bg-surface tw-border tw-rounded-xl tw-p-2.5 tw-text-left tw-flex tw-flex-col tw-gap-1.5 active:tw-scale-[0.96] tw-transition-all tw-cursor-pointer disabled:tw-opacity-30 disabled:tw-cursor-not-allowed "
                      + (inCart ? "tw-border-accent tw-shadow-sm" : "tw-border-border")}
                    onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                    {inCart && (
                      <span className="tw-absolute tw-top-[-6px] tw-right-[-4px] tw-bg-accent tw-text-white tw-text-[9px] tw-font-bold tw-w-[18px] tw-h-[18px] tw-rounded-full tw-grid tw-place-items-center tw-shadow-sm">{inCart.q}</span>
                    )}
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
            {filtered.length > 0 && <Pagination {...pagProd} label="productos"/>}
          </div>

          {/* Carrito flotante / bottom bar */}
          <div className="tw-shrink-0 tw-bg-surface tw-border-t tw-border-border tw-shadow-lg">
            {cart.length === 0 ? (
              /* Empty: barra mínima con icono */
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-text-txt-3">
                <Icon name="cart" size={15}/>
                <span className="tw-text-xs">Carrito vacío</span>
              </div>
            ) : (<>
              {/* Items del carrito — expandible */}
              <div className="tw-max-h-[30vh] tw-overflow-y-auto">
                {cart.map((l, i) => (
                  <div key={l.sku} className={"tw-flex tw-items-center tw-gap-2.5 tw-px-4 tw-py-2" + (i < cart.length - 1 ? " tw-border-b tw-border-border" : "")}>
                    <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-accent-soft tw-text-accent tw-grid tw-place-items-center tw-shrink-0">
                      <span className="tw-text-[11px] tw-font-bold">{l.q}</span>
                    </div>
                    <div className="tw-flex-1 tw-min-w-0">
                      <div className="tw-text-xs tw-font-medium tw-leading-tight tw-truncate">{l.nombre}</div>
                      <div className="mono tw-text-[10px] tw-text-txt-3">{window.fmtCOP(l.precio)} c/u</div>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-1.5 tw-shrink-0">
                      <div className="tw-inline-flex tw-items-center tw-border tw-border-border tw-rounded-lg tw-overflow-hidden tw-bg-surface-2">
                        <button className="tw-bg-transparent tw-border-0 tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-3 tw-transition-colors" onClick={() => setQty(l.sku, -1)}><Icon name="minus" size={10}/></button>
                        <span className="tw-px-1 tw-tabular-nums tw-text-[11px] tw-font-semibold tw-min-w-[20px] tw-text-center">{l.q}</span>
                        <button className="tw-bg-transparent tw-border-0 tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-cursor-pointer hover:tw-bg-surface-3 tw-transition-colors" onClick={() => setQty(l.sku, +1)}><Icon name="plus" size={10}/></button>
                      </div>
                      <span className="mono tw-font-semibold tw-text-xs tw-tabular-nums tw-min-w-[60px] tw-text-right">{window.fmtCOP(l.q * l.precio)}</span>
                      <button className="tw-text-txt-3 tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer hover:tw-text-bad tw-transition-colors" onClick={() => removeLine(l.sku)}><Icon name="x" size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Footer: total + cobrar */}
              <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-border-t tw-border-border tw-bg-surface-2">
                <button className="tw-bg-transparent tw-border tw-border-border tw-rounded-lg tw-w-8 tw-h-8 tw-grid tw-place-items-center tw-cursor-pointer tw-text-bad hover:tw-bg-bad-soft tw-transition-colors tw-shrink-0" onClick={() => setCart([])} title="Vaciar carrito">
                  <Icon name="trash" size={14}/>
                </button>
                <div className="tw-flex-1">
                  <div className="tw-text-[10px] tw-text-txt-3">{totals.items} producto{totals.items !== 1 ? "s" : ""}</div>
                  <div className="mono tw-text-lg tw-font-bold tw-tracking-tight tw-leading-tight">{window.fmtCOP(totals.total)}</div>
                </div>
                <button className="tw-bg-accent tw-text-white tw-border-0 tw-rounded-xl tw-py-2.5 tw-px-5 tw-text-sm tw-font-bold tw-cursor-pointer tw-shadow-sm active:tw-scale-[0.97] tw-transition-transform tw-flex tw-items-center tw-gap-1.5" onClick={() => setPay("modal")}>
                  <Icon name="cart" size={15}/> Cobrar
                </button>
              </div>
            </>)}
          </div>
        </div>
      </div>

      <ThemeToggle theme={theme} setTheme={setTheme}/>

      {pay && <PaymentModal total={totals.total} items={totals.items} onClose={() => setPay(null)} onPay={completePay}/>}
      {done && <ReceiptModal factura={done} onClose={() => setDone(null)}/>}
      {closing && <CloseShiftModal shift={shift} stats={shiftStats} onClose={() => setClosing(false)} onConfirm={closeShift}/>}
      {scanOpen && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScanOpen(false)}/>}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </div>
  );
};

// =================== Modal de pago ===================
const PaymentModal = ({ total, items, onClose, onPay }) => {
  const [metodo, setMetodo] = useState("Efectivo");
  const [recibido, setRecibido] = useState(0);
  const cambio = Math.max(0, recibido - total);

  const onKey = (k) => {
    if (k === "C") return setRecibido(0);
    if (k === "←") return setRecibido(r => Math.floor(r / 10));
    setRecibido(r => Math.min(r * 10 + parseInt(k), 99999999));
  };

  const canPay = metodo !== "Efectivo" || recibido >= total;

  return (
    <div className="modal-bg" onClick={onClose}>
      {/* Desktop: modal clásico */}
      <div className="modal lg tw-hidden sm:tw-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Cobrar venta</h3>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-b">
          <div className="tw-grid tw-grid-cols-2 tw-gap-5">
            <div>
              <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider tw-mb-1.5">Método de pago</div>
              <div className="tw-flex tw-flex-col tw-gap-1.5">
                {["Efectivo", "Transferencia", "Nequi", "Daviplata"].map(m => (
                  <button key={m} className={"btn" + (metodo === m ? " primary" : "")} onClick={() => setMetodo(m)} style={{ justifyContent: "flex-start" }}>
                    <span className="tw-w-2 tw-h-2 tw-rounded-full" style={{ background: metodo === m ? "currentColor" : "var(--text-3)" }}/>
                    {m}
                  </button>
                ))}
              </div>
              <div className="card tw-mt-3 tw-bg-surface-2">
                <div className="card-b">
                  <div className="row spaced"><span className="muted">Items</span><span className="mono">{items}</span></div>
                  <div className="row spaced"><span className="muted">Total</span><span className="mono tw-text-[22px] tw-font-semibold">{window.fmtCOP(total)}</span></div>
                  {metodo === "Efectivo" && (
                    <>
                      <div className="row spaced tw-mt-2"><span className="muted">Recibido</span><span className="mono">{window.fmtCOP(recibido)}</span></div>
                      <div className="row spaced"><span className="muted">Cambio</span><span className="mono tw-font-semibold" style={{ color: cambio > 0 ? "var(--good)" : "var(--text-2)" }}>{window.fmtCOP(cambio)}</span></div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div>
              {metodo === "Efectivo" ? (
                <>
                  <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider tw-mb-1.5">Efectivo recibido</div>
                  <div className="cash-suggestions tw-flex tw-flex-wrap tw-gap-1.5">
                    {[total, 50000, 100000, 200000].map((v, i) => (
                      <button key={i} onClick={() => setRecibido(v)}>${v.toLocaleString("es-CO")}</button>
                    ))}
                  </div>
                  <div className="keypad tw-mt-2">
                    {["1","2","3","4","5","6","7","8","9","C","0","←"].map(k => (
                      <button key={k} onClick={() => onKey(k)}>{k}</button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="card tw-bg-surface-2">
                  <div className="card-b tw-text-center tw-p-8">
                    <div className="tw-w-20 tw-h-20 tw-rounded-xl tw-bg-surface tw-mx-auto tw-mb-3.5 tw-grid tw-place-items-center tw-border tw-border-border">
                      <Icon name={metodo === "Transferencia" ? "settings" : "pkg"} size={32}/>
                    </div>
                    <div className="tw-font-semibold tw-mb-1">Esperando pago por {metodo}…</div>
                    <div className="muted tw-text-xs">El cliente debe confirmar la transacción en el datafono o aplicación.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn accent" disabled={!canPay}
            onClick={() => onPay(metodo, metodo === "Efectivo" ? recibido : total)}>
            <Icon name="check"/> Confirmar pago
          </button>
        </div>
      </div>

      {/* Mobile: fullscreen bottom sheet optimizado */}
      <div className="sm:tw-hidden tw-fixed tw-inset-0 tw-flex tw-flex-col tw-bg-surface tw-z-[101]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-border tw-shrink-0">
          <div>
            <div className="tw-text-base tw-font-bold">Cobrar venta</div>
            <div className="tw-text-[11px] tw-text-txt-3">{items} producto{items !== 1 ? "s" : ""}</div>
          </div>
          <button className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-border tw-bg-surface-2 tw-grid tw-place-items-center tw-cursor-pointer" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        {/* Total prominente */}
        <div className="tw-text-center tw-py-3 tw-border-b tw-border-border tw-bg-surface-2 tw-shrink-0">
          <div className="tw-text-[10px] tw-text-txt-3 tw-uppercase tw-tracking-wider">Total a cobrar</div>
          <div className="mono tw-text-2xl tw-font-bold tw-tracking-tight">{window.fmtCOP(total)}</div>
        </div>

        {/* Contenido scrolleable */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Métodos de pago — horizontal */}
          <div className="tw-px-4 tw-pt-3 tw-pb-2">
            <div className="tw-text-[10px] tw-text-txt-3 tw-uppercase tw-tracking-wider tw-mb-2">Método de pago</div>
            <div className="tw-grid tw-grid-cols-4 tw-gap-1.5">
              {["Efectivo", "Transfer.", "Nequi", "Daviplata"].map((label, idx) => {
                const val = ["Efectivo", "Transferencia", "Nequi", "Daviplata"][idx];
                return (
                  <button key={val}
                    className={"tw-flex tw-flex-col tw-items-center tw-gap-1 tw-py-2 tw-px-1 tw-rounded-xl tw-border tw-text-[10px] tw-font-medium tw-cursor-pointer tw-transition-all "
                      + (metodo === val
                        ? "tw-bg-accent tw-text-white tw-border-accent tw-shadow-sm"
                        : "tw-bg-surface-2 tw-text-txt-2 tw-border-border")}
                    onClick={() => setMetodo(val)}>
                    <Icon name={val === "Efectivo" ? "cart" : val === "Transferencia" ? "settings" : "pkg"} size={16}/>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {metodo === "Efectivo" ? (
            <div className="tw-px-4 tw-pb-3">
              {/* Recibido display */}
              <div className="tw-bg-surface-2 tw-rounded-xl tw-p-3 tw-mb-2">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-xs tw-text-txt-3">Recibido</span>
                  <span className="mono tw-text-lg tw-font-bold">{window.fmtCOP(recibido)}</span>
                </div>
                {recibido >= total && (
                  <div className="tw-flex tw-justify-between tw-items-center tw-mt-1 tw-pt-1 tw-border-t tw-border-border">
                    <span className="tw-text-xs tw-text-txt-3">Cambio</span>
                    <span className="mono tw-font-bold tw-text-good">{window.fmtCOP(cambio)}</span>
                  </div>
                )}
              </div>

              {/* Sugerencias rápidas */}
              <div className="tw-grid tw-grid-cols-4 tw-gap-1.5 tw-mb-2">
                {[total, 50000, 100000, 200000].map((v, i) => (
                  <button key={i}
                    className={"tw-py-1.5 tw-rounded-lg tw-border tw-text-[11px] tw-font-medium tw-cursor-pointer tw-transition-all mono "
                      + (recibido === v ? "tw-bg-accent tw-text-white tw-border-accent" : "tw-bg-surface-2 tw-border-border")}
                    onClick={() => setRecibido(v)}>${v >= 1000 ? Math.round(v/1000) + "k" : v.toLocaleString("es-CO")}</button>
                ))}
              </div>

              {/* Keypad compacto */}
              <div className="tw-grid tw-grid-cols-3 tw-gap-1.5">
                {["1","2","3","4","5","6","7","8","9","C","0","←"].map(k => (
                  <button key={k}
                    className={"tw-py-3 tw-rounded-xl tw-border tw-border-border tw-text-base tw-font-medium tw-cursor-pointer tw-transition-all active:tw-scale-[0.95] "
                      + (k === "C" ? "tw-bg-bad-soft tw-text-bad" : k === "←" ? "tw-bg-surface-2 tw-text-txt-2" : "tw-bg-surface tw-text-txt")}
                    onClick={() => onKey(k)}>{k}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="tw-px-4 tw-py-6 tw-text-center">
              <div className="tw-w-16 tw-h-16 tw-rounded-2xl tw-bg-accent-soft tw-text-accent tw-mx-auto tw-mb-3 tw-grid tw-place-items-center">
                <Icon name={metodo === "Transferencia" ? "settings" : "pkg"} size={28}/>
              </div>
              <div className="tw-font-semibold tw-mb-1">Pago por {metodo}</div>
              <div className="tw-text-xs tw-text-txt-3">El cliente debe confirmar la transacción.</div>
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="tw-px-4 tw-py-3 tw-border-t tw-border-border tw-bg-surface-2 tw-shrink-0 tw-flex tw-gap-2">
          <button className="tw-flex-1 tw-py-2.5 tw-rounded-xl tw-border tw-border-border tw-bg-surface tw-text-sm tw-font-medium tw-cursor-pointer" onClick={onClose}>Cancelar</button>
          <button
            className={"tw-flex-[2] tw-py-2.5 tw-rounded-xl tw-border-0 tw-text-sm tw-font-bold tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-transition-opacity "
              + (canPay ? "tw-bg-accent tw-text-white" : "tw-bg-surface-3 tw-text-txt-3 tw-opacity-50 tw-cursor-not-allowed")}
            disabled={!canPay}
            onClick={() => onPay(metodo, metodo === "Efectivo" ? recibido : total)}>
            <Icon name="check" size={15}/> Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
};

// =================== Recibo ===================
const ReceiptModal = ({ factura, onClose }) => (
  <Modal title="Venta completada" onClose={onClose} bottomSheet footer={
    <>
      <button className="btn"><Icon name="print"/> Imprimir</button>
      <button className="btn primary" onClick={onClose}>Nueva venta <Icon name="arrowRight"/></button>
    </>
  }>
    <div className="receipt">
      <h4>Minimercado El Vecino</h4>
      <div className="center">NIT 901.234.567-8 · {factura.caja}</div>
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
      <div className="center">¡Gracias por tu compra!</div>
    </div>
  </Modal>
);

// =================== Cierre de turno ===================
const CloseShiftModal = ({ shift, stats, onClose, onConfirm }) => {
  const [contado, setContado] = useState(shift.base + stats.ventas);
  const esperado = shift.base + stats.ventas;
  const diff = contado - esperado;

  const diffBg = diff === 0 ? "var(--good-soft)" : (diff > 0 ? "var(--warn-soft)" : "var(--bad-soft)");
  const diffColor = diff === 0 ? "var(--good)" : (diff > 0 ? "var(--warn)" : "var(--bad)");
  const diffMsg = diff === 0 ? "Caja cuadra perfectamente." : diff > 0 ? "Sobrante en caja — revisar." : "Faltante — debe justificarse.";

  return (
    <div className="modal-bg" onClick={onClose}>
      {/* Desktop: modal clásico */}
      <div className="modal lg tw-hidden sm:tw-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Cerrar turno</h3>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-b">
          <div className="tw-grid tw-grid-cols-2 tw-gap-5">
            <div>
              <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider tw-mb-2">Resumen del turno</div>
              <div className="card tw-bg-surface-2">
                <div className="card-b">
                  <div className="row spaced"><span className="muted">Base inicial</span><span className="mono">{window.fmtCOP(shift.base)}</span></div>
                  <div className="row spaced"><span className="muted">Ventas en efectivo</span><span className="mono">{window.fmtCOP(stats.ventas)}</span></div>
                  <div className="row spaced"><span className="muted">Transacciones</span><span className="mono">{stats.trans}</span></div>
                  <div className="row spaced"><span className="muted">Productos vendidos</span><span className="mono">{stats.items}</span></div>
                  <hr className="tw-border-0 tw-border-t tw-border-border tw-my-2.5"/>
                  <div className="row spaced"><span className="tw-font-semibold">Esperado en caja</span><span className="mono tw-font-semibold tw-text-[17px]">{window.fmtCOP(esperado)}</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="field">
                <label>Efectivo contado físicamente</label>
                <input className="mono" value={contado.toLocaleString("es-CO")} onChange={e => setContado(parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
              </div>
              <div className="card" style={{ background: diffBg }}>
                <div className="card-b">
                  <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider">Diferencia</div>
                  <div className="mono tw-text-[22px] tw-font-semibold tw-mt-1">{diff > 0 ? "+" : ""}{window.fmtCOP(diff)}</div>
                  <div className="tw-text-xs tw-mt-1">{diffMsg}</div>
                </div>
              </div>
              <div className="field tw-mt-2">
                <label>Observaciones (opcional)</label>
                <textarea rows="3" placeholder="Ej: cliente recibió mal el cambio…"/>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={onConfirm}><Icon name="check"/> Confirmar cierre</button>
        </div>
      </div>

      {/* Mobile: fullscreen */}
      <div className="sm:tw-hidden tw-fixed tw-inset-0 tw-flex tw-flex-col tw-bg-surface tw-z-[101]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-border tw-shrink-0">
          <div className="tw-text-base tw-font-bold">Cerrar turno</div>
          <button className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-border tw-bg-surface-2 tw-grid tw-place-items-center tw-cursor-pointer" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        {/* Contenido scrolleable */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Resumen del turno */}
          <div className="tw-px-4 tw-pt-3 tw-pb-2">
            <div className="tw-text-[10px] tw-text-txt-3 tw-uppercase tw-tracking-wider tw-mb-2">Resumen del turno</div>
            <div className="tw-bg-surface-2 tw-rounded-xl tw-p-3 tw-flex tw-flex-col tw-gap-1.5">
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-xs tw-text-txt-3">Base inicial</span>
                <span className="mono tw-text-xs tw-font-medium">{window.fmtCOP(shift.base)}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-xs tw-text-txt-3">Ventas</span>
                <span className="mono tw-text-xs tw-font-medium">{window.fmtCOP(stats.ventas)}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-xs tw-text-txt-3">Transacciones</span>
                <span className="mono tw-text-xs tw-font-medium">{stats.trans}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-xs tw-text-txt-3">Productos</span>
                <span className="mono tw-text-xs tw-font-medium">{stats.items}</span>
              </div>
              <div className="tw-border-t tw-border-border tw-pt-1.5 tw-mt-0.5">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-sm tw-font-semibold">Esperado en caja</span>
                  <span className="mono tw-text-base tw-font-bold">{window.fmtCOP(esperado)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conteo físico */}
          <div className="tw-px-4 tw-pb-2">
            <div className="tw-text-[10px] tw-text-txt-3 tw-uppercase tw-tracking-wider tw-mb-2">Conteo físico</div>
            <div className="field tw-mb-0">
              <label className="tw-text-xs">Efectivo contado</label>
              <input className="mono" value={contado.toLocaleString("es-CO")} onChange={e => setContado(parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
            </div>
          </div>

          {/* Diferencia */}
          <div className="tw-px-4 tw-pb-2">
            <div className="tw-rounded-xl tw-p-3" style={{ background: diffBg }}>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-xs tw-font-medium">Diferencia</span>
                <span className="mono tw-text-xl tw-font-bold" style={{ color: diffColor }}>{diff > 0 ? "+" : ""}{window.fmtCOP(diff)}</span>
              </div>
              <div className="tw-text-[11px] tw-mt-1 tw-opacity-80">{diffMsg}</div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="tw-px-4 tw-pb-3">
            <div className="field tw-mb-0">
              <label className="tw-text-xs">Observaciones (opcional)</label>
              <textarea rows="2" placeholder="Ej: cliente recibió mal el cambio…" className="tw-text-sm"/>
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="tw-px-4 tw-py-3 tw-border-t tw-border-border tw-bg-surface-2 tw-shrink-0 tw-flex tw-gap-2">
          <button className="tw-flex-1 tw-py-2.5 tw-rounded-xl tw-border tw-border-border tw-bg-surface tw-text-sm tw-font-medium tw-cursor-pointer" onClick={onClose}>Cancelar</button>
          <button className="tw-flex-[2] tw-py-2.5 tw-rounded-xl tw-border-0 tw-bg-accent tw-text-white tw-text-sm tw-font-bold tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-gap-1.5" onClick={onConfirm}>
            <Icon name="check" size={15}/> Confirmar cierre
          </button>
        </div>
      </div>
    </div>
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
