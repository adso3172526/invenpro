// Flujo del cajero: apertura de turno → POS → cierre
const { useState, useEffect, useMemo } = React;

// =================== Apertura de turno ===================
const ShiftOpen = ({ cajero, onOpen, onLogout }) => {
  const [base, setBase] = useState(200000);
  const [caja, setCaja] = useState("Caja 01");
  return (
    <div className="shift-open-shell">
      <div className="card shift-open-card">
        <div className="card-h" style={{ flexDirection: "column", alignItems: "flex-start", padding: "20px 22px" }}>
          <div className="row" style={{ marginBottom: 6 }}>
            <img src="logo.png" alt="InvenPro" style={{ height: 26, objectFit: "contain" }}/>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "8px 0 4px" }}>Abrir turno</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Hola {cajero.nombre}. Confirma la base de caja inicial para empezar a facturar.</p>
        </div>
        <div className="card-b" style={{ padding: "20px 22px" }}>
          <div className="grid-2">
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
            <div className="cash-suggestions">
              {[100000, 150000, 200000, 250000, 300000].map(v => (
                <button key={v} type="button" onClick={() => setBase(v)}>${v.toLocaleString("es-CO")}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-f" style={{ background: "var(--surface-2)" }}>
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="crumb">
          <img src="logo.png" alt="InvenPro" style={{ height: 22, objectFit: "contain" }}/>
          <h1>Caja {shift.caja.replace("Caja ", "")}</h1>
          <span className="muted">·</span>
          <span className="sub">{cajero.nombre}</span>
          <span className="chip good"><span className="dot"/> Turno abierto</span>
        </div>
        <div className="actions">
          <span className="muted mono" style={{ fontSize: 12 }}>{shiftStats.trans} ventas · {window.fmtCOP(shiftStats.ventas)}</span>
          <button className="btn sm" onClick={onLogout} title="Salir sin cerrar turno"><Icon name="arrowRight" size={14}/> Salir</button>
          <button className="btn sm" onClick={() => setClosing(true)}><Icon name="logout" size={14}/> Cerrar turno</button>
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
            {filtered.map(p => (
              <button key={p.sku} className="product" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                <div className="thumb">
                  <Icon name={
                    p.categoria === "Lácteos" ? "box" :
                    p.categoria === "Bebidas" ? "box" :
                    p.categoria === "Frescos" ? "box" :
                    "box"
                  } size={22}/>
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
        </div>

        {/* Carrito */}
        <div className="cart">
          <div className="cart-h">
            <div>
              <h3>Venta actual</h3>
              <div className="ticket">Ticket #{(10310 + shiftStats.trans).toString().padStart(6, "0")}</div>
            </div>
            {cart.length > 0 && (
              <button className="btn sm danger" onClick={() => setCart([])}><Icon name="trash" size={13}/> Vaciar</button>
            )}
          </div>
          {cart.length === 0 ? (
            <div className="cart-list">
              <div className="cart-empty">
                <div className="big"><Icon name="cart" size={22}/></div>
                <div style={{ fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Carrito vacío</div>
                <div style={{ fontSize: 12 }}>Selecciona productos del catálogo o escanea un código</div>
              </div>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map(l => (
                <div className="cart-line" key={l.sku}>
                  <div>
                    <div className="name">{l.nombre}</div>
                    <div className="sub mono">{window.fmtCOP(l.precio)} c/u · {l.codigoBarras || l.sku}</div>
                    <div className="qty">
                      <button onClick={() => setQty(l.sku, -1)}><Icon name="minus" size={12}/></button>
                      <span>{l.q}</span>
                      <button onClick={() => setQty(l.sku, +1)}><Icon name="plus" size={12}/></button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="line-price mono">{window.fmtCOP(l.q * l.precio)}</div>
                    <button className="rm" onClick={() => removeLine(l.sku)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="cart-totals">
            <div className="row"><span>Productos</span><span>{totals.items} und</span></div>
            <div className="row"><span>Subtotal</span><span>{window.fmtCOP(totals.sub)}</span></div>
            <div className="row"><span>Descuentos</span><span>$0</span></div>
            <div className="row total"><span>Total</span><span>{window.fmtCOP(totals.total)}</span></div>
            <div className="ops">
              <button className="btn sm" disabled={cart.length === 0}><Icon name="clock" size={13}/> En espera</button>
              <button className="btn sm" disabled={cart.length === 0}><Icon name="settings" size={13}/> Descuento</button>
            </div>
            <button className="btn accent full lg pay" disabled={cart.length === 0} onClick={() => setPay("modal")}>
              <Icon name="cart" size={16}/> Cobrar {window.fmtCOP(totals.total)}
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
    <Modal title="Cobrar venta" onClose={onClose} lg footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn accent" disabled={metodo === "Efectivo" && recibido < total}
          onClick={() => onPay(metodo, metodo === "Efectivo" ? recibido : total)}>
          <Icon name="check"/> Confirmar pago
        </button>
      </>
    }>
      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Método de pago</div>
          <div className="col" style={{ gap: 6 }}>
            {["Efectivo", "Transferencia", "Nequi", "Daviplata"].map(m => (
              <button key={m} className={"btn" + (metodo === m ? " primary" : "")} onClick={() => setMetodo(m)} style={{ justifyContent: "flex-start" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: metodo === m ? "currentColor" : "var(--text-3)" }}/>
                {m}
              </button>
            ))}
          </div>
          <div className="card mt-3" style={{ background: "var(--surface-2)" }}>
            <div className="card-b">
              <div className="row spaced"><span className="muted">Items</span><span className="mono">{items}</span></div>
              <div className="row spaced"><span className="muted">Total</span><span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{window.fmtCOP(total)}</span></div>
              {metodo === "Efectivo" && (
                <>
                  <div className="row spaced mt-2"><span className="muted">Recibido</span><span className="mono">{window.fmtCOP(recibido)}</span></div>
                  <div className="row spaced"><span className="muted">Cambio</span><span className="mono" style={{ color: cambio > 0 ? "var(--good)" : "var(--text-2)", fontWeight: 600 }}>{window.fmtCOP(cambio)}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          {metodo === "Efectivo" ? (
            <>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Efectivo recibido</div>
              <div className="cash-suggestions">
                {[total, 50000, 100000, 200000].map((v, i) => (
                  <button key={i} onClick={() => setRecibido(v)}>${v.toLocaleString("es-CO")}</button>
                ))}
              </div>
              <div className="keypad mt-2">
                {["1","2","3","4","5","6","7","8","9","C","0","←"].map(k => (
                  <button key={k} onClick={() => onKey(k)}>{k}</button>
                ))}
              </div>
            </>
          ) : (
            <div className="card" style={{ background: "var(--surface-2)" }}>
              <div className="card-b" style={{ textAlign: "center", padding: 30 }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, background: "var(--surface)", margin: "0 auto 14px", display: "grid", placeItems: "center", border: "1px solid var(--border)" }}>
                  <Icon name={metodo === "Transferencia" ? "settings" : "pkg"} size={32}/>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Esperando pago por {metodo}…</div>
                <div className="muted" style={{ fontSize: 12 }}>El cliente debe confirmar la transacción en el datafono o aplicación.</div>
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
  <Modal title="Venta completada" onClose={onClose} footer={
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
    <Modal title="Cerrar turno" onClose={onClose} lg footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={onConfirm}><Icon name="check"/> Confirmar cierre</button>
      </>
    }>
      <div className="grid-2">
        <div>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Resumen del turno</div>
          <div className="card" style={{ background: "var(--surface-2)" }}>
            <div className="card-b">
              <div className="row spaced"><span className="muted">Base inicial</span><span className="mono">{window.fmtCOP(shift.base)}</span></div>
              <div className="row spaced"><span className="muted">Ventas en efectivo</span><span className="mono">{window.fmtCOP(stats.ventas)}</span></div>
              <div className="row spaced"><span className="muted">Transacciones</span><span className="mono">{stats.trans}</span></div>
              <div className="row spaced"><span className="muted">Productos vendidos</span><span className="mono">{stats.items}</span></div>
              <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "10px 0" }}/>
              <div className="row spaced"><span style={{ fontWeight: 600 }}>Esperado en caja</span><span className="mono" style={{ fontWeight: 600, fontSize: 17 }}>{window.fmtCOP(esperado)}</span></div>
            </div>
          </div>
        </div>
        <div>
          <div className="field">
            <label>Efectivo contado físicamente</label>
            <input className="mono" value={contado.toLocaleString("es-CO")} onChange={e => setContado(parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
          </div>
          <div className={"card"} style={{ background: diff === 0 ? "var(--good-soft)" : (diff > 0 ? "var(--warn-soft)" : "var(--bad-soft)") }}>
            <div className="card-b">
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>Diferencia</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>
                {diff > 0 ? "+" : ""}{window.fmtCOP(diff)}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {diff === 0 ? "Caja cuadra perfectamente." : diff > 0 ? "Sobrante en caja — revisar." : "Faltante — debe justificarse."}
              </div>
            </div>
          </div>
          <div className="field mt-2">
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
  <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--bg)" }}>
    <div className="card" style={{ width: "min(94vw, 480px)" }}>
      <div className="card-b" style={{ textAlign: "center", padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--good-soft)", color: "var(--good)", margin: "0 auto 14px", display: "grid", placeItems: "center" }}>
          <Icon name="check" size={28}/>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Turno cerrado</h2>
        <p className="muted">Total facturado en este turno</p>
        <div className="mono" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>{window.fmtCOP(summary.ventas)}</div>
        <div className="muted" style={{ fontSize: 13 }}>{summary.trans} ventas · {summary.items} productos</div>
        <button className="btn primary full lg mt-4" onClick={onLogout}>
          <Icon name="logout" size={16}/> Cerrar sesión
        </button>
      </div>
    </div>
  </div>
);

Object.assign(window, { ShiftOpen, POS, ShiftClosed });
