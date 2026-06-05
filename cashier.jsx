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
    <div className="tw-min-h-screen tw-flex tw-flex-col tw-bg-bg">
      {/* Topbar */}
      <div className="topbar tw-flex tw-flex-wrap tw-gap-2">
        <div className="crumb tw-flex-1 tw-min-w-0">
          <img src="logo.png" alt="InvenPro" className="tw-h-[22px] tw-object-contain tw-hidden sm:tw-block"/>
          <h1>Caja {shift.caja.replace("Caja ", "")}</h1>
          <span className="muted tw-hidden sm:tw-inline">·</span>
          <span className="sub tw-hidden sm:tw-inline">{cajero.nombre}</span>
          <span className="chip good"><span className="dot"/> Turno abierto</span>
        </div>
        <div className="actions tw-flex tw-items-center tw-gap-2">
          <span className="muted mono tw-text-xs tw-hidden sm:tw-inline">{shiftStats.trans} ventas · {window.fmtCOP(shiftStats.ventas)}</span>
          <button className="btn sm" onClick={onLogout} title="Salir sin cerrar turno"><Icon name="arrowRight" size={14}/> <span className="tw-hidden sm:tw-inline">Salir</span></button>
          <button className="btn sm" onClick={() => setClosing(true)}><Icon name="logout" size={14}/> <span className="tw-hidden sm:tw-inline">Cerrar turno</span></button>
        </div>
      </div>

      {/* Layout POS */}
      <div className="pos">
        <div className="pos-left">
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
                  // 1. Match exacto en codigo_barras (escáner físico)
                  let p = productos.find(x => x.codigoBarras === term);
                  // 2. Match exacto en SKU
                  if (!p) p = productos.find(x => x.sku === term);
                  // 3. Primer resultado por nombre
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
                <div className="thumb">
                  <Icon name="box" size={22}/>
                </div>
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

        {/* Carrito */}
        <div className="cart tw-bg-surface tw-border-l tw-border-border tw-flex tw-flex-col tw-min-h-0 tw-max-h-[50vh] md:tw-max-h-none">
          {/* Header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2.5 tw-border-b tw-border-border tw-shrink-0">
            <div>
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold">Venta actual</h3>
              <div className="mono tw-text-[10px] tw-text-txt-3">Ticket #{(10310 + shiftStats.trans).toString().padStart(6, "0")}</div>
            </div>
            {cart.length > 0 && (
              <button className="btn sm danger" onClick={() => setCart([])}><Icon name="trash" size={12}/> Vaciar</button>
            )}
          </div>

          {/* Lista de productos */}
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

          {/* Totales */}
          <div className="tw-px-3 tw-py-2.5 tw-border-t tw-border-border tw-bg-surface-2 tw-shrink-0">
            <div className="tw-flex tw-justify-between tw-py-0.5 tw-text-xs tw-text-txt-2 tw-tabular-nums"><span>Productos</span><span>{totals.items} und</span></div>
            <div className="tw-flex tw-justify-between tw-py-0.5 tw-text-xs tw-text-txt-2 tw-tabular-nums"><span>Subtotal</span><span>{window.fmtCOP(totals.sub)}</span></div>
            <div className="tw-flex tw-justify-between tw-mt-1 tw-pt-2 tw-border-t tw-border-border tw-text-base tw-font-semibold tw-tracking-tight tw-tabular-nums">
              <span>Total</span><span>{window.fmtCOP(totals.total)}</span>
            </div>
            <button className="btn accent full tw-mt-2 tw-py-2.5 tw-text-sm tw-font-semibold" disabled={cart.length === 0} onClick={() => setPay("modal")}>
              <Icon name="cart" size={15}/> Cobrar {window.fmtCOP(totals.total)}
            </button>
          </div>
        </div>
      </div>

      <ThemeToggle theme={theme} setTheme={setTheme}/>

      {pay && <PaymentModal total={totals.total} items={totals.items} onClose={() => setPay(null)} onPay={completePay}/>}
      {done && <ReceiptModal factura={done} onClose={() => setDone(null)}/>}
      {closing && <CloseShiftModal shift={shift} stats={shiftStats} onClose={() => setClosing(false)} onConfirm={closeShift}/>}
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

  return (
    <Modal title="Cobrar venta" onClose={onClose} lg bottomSheet footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn accent" disabled={metodo === "Efectivo" && recibido < total}
          onClick={() => onPay(metodo, metodo === "Efectivo" ? recibido : total)}>
          <Icon name="check"/> Confirmar pago
        </button>
      </>
    }>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-5">
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
    </Modal>
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
  return (
    <Modal title="Cerrar turno" onClose={onClose} lg bottomSheet footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={onConfirm}><Icon name="check"/> Confirmar cierre</button>
      </>
    }>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-5">
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
          <div className="card" style={{ background: diff === 0 ? "var(--good-soft)" : (diff > 0 ? "var(--warn-soft)" : "var(--bad-soft)") }}>
            <div className="card-b">
              <div className="muted tw-text-[11px] tw-uppercase tw-tracking-wider">Diferencia</div>
              <div className="mono tw-text-[22px] tw-font-semibold tw-mt-1">
                {diff > 0 ? "+" : ""}{window.fmtCOP(diff)}
              </div>
              <div className="tw-text-xs tw-mt-1">
                {diff === 0 ? "Caja cuadra perfectamente." : diff > 0 ? "Sobrante en caja — revisar." : "Faltante — debe justificarse."}
              </div>
            </div>
          </div>
          <div className="field tw-mt-2">
            <label>Observaciones (opcional)</label>
            <textarea rows="3" placeholder="Ej: cliente recibió mal el cambio…"/>
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
