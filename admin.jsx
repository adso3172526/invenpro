// Panel de administración: dashboard + inventario + ingreso + cajeros + reportes + vencimientos
const { useState: useStateA, useMemo: useMemoA } = React;

// Exportar a XLSX usando SheetJS (cargado vía CDN)
const exportXlsx = (filename, sheets) => {
  if (!window.XLSX) { alert("Librería de Excel no disponible."); return; }
  const wb = window.XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = window.XLSX.utils.json_to_sheet(rows);
    window.XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  window.XLSX.writeFile(wb, filename);
};

// =================== Sidebar ===================
const NAV = [
  { id: "dashboard",   label: "Dashboard",          icon: "chart",    color: "#3B82F6" },
  { id: "pos",         label: "Facturar",           icon: "cart",     color: "#0EA5E9" },
  { id: "inventory",   label: "Inventario",         icon: "box",      color: "#22C55E" },
  { id: "ingreso",     label: "Ingreso mercancía",  icon: "truck",    color: "#F59E0B" },
  { id: "vence",       label: "Vencimientos",       icon: "calendar", color: "#EF4444", badge: "5" },
  { id: "proveedores", label: "Proveedores",        icon: "store",    color: "#A16207" },
  { id: "cajeros",     label: "Cajeros y turnos",   icon: "users",    color: "#9CA3AF" },
  { id: "reportes",    label: "Reporte de ventas",  icon: "chart",    color: "#8B5CF6" },
  { id: "ajustes",     label: "Ajustes",            icon: "settings", color: "#6B7280", rol: "Administrador" },
];

const Sidebar = ({ active, setActive, user, onLogout }) => {
  const [open, setOpen] = useStateA(false);
  const goTo = (id) => { setActive(id); setOpen(false); };
  const activeItem = NAV.find(n => n.id === active);

  return (
    <>
      {/* Mobile topbar: hamburger + título */}
      <div className="mobile-topbar">
        <button className="mobile-burger" onClick={() => setOpen(o => !o)} aria-label="Menú">
          <span/><span/><span/>
        </button>
        <img src="logo.png" alt="InvenPro" style={{ height: 26, objectFit: "contain" }}/>
        <div className="mobile-active-label">{activeItem ? activeItem.label : ""}</div>
      </div>

      {/* Sidebar lateral (desktop) y menú overlay (mobile) */}
      <aside className={"sidebar tw-w-[min(75vw,280px)] md:tw-w-auto" + (open ? " open" : "")}>
        <div className="mobile-menu-h">
          <img src="logo.png" alt="InvenPro" style={{ height: 28, objectFit: "contain" }}/>
          <button className="btn sm ghost" onClick={() => setOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="brand" style={{ paddingTop: 8, justifyContent: "center", display: "flex" }}>
          <img src="logo.png" alt="InvenPro" style={{ height: 36, objectFit: "contain" }}/>
        </div>
        <div className="nav-cards">
          {NAV.filter(n => !n.rol || (user && user.rol === n.rol)).map(n => (
            <div key={n.id}
                 className={"nav-card" + (active === n.id ? " active" : "")}
                 style={{ "--nav-c": n.color }}
                 onClick={() => goTo(n.id)}
                 title={n.label}>
              <div className="nav-card-top">
                <Icon name={n.icon} size={26}/>
                {n.badge && <span className="nav-card-badge">{n.badge}</span>}
              </div>
              <div className="nav-card-label-mobile">{n.label}</div>
            </div>
          ))}
        </div>
        <div className="user">
          <div className="avatar">{(user && user.nombre) ? user.nombre[0] : "A"}</div>
          <div className="user-info-mobile">
            <div className="name-m">{user && user.nombre}</div>
            <div className="role-m">{user && user.rol}</div>
          </div>
          <div className="flex-1">
            <div className="name">{user && user.nombre}</div>
            <div className="role">{user && user.rol}</div>
          </div>
          <button className="btn sm ghost" onClick={onLogout} title="Salir"><Icon name="logout" size={14}/> <span className="user-logout-label">Cerrar sesión</span></button>
        </div>
      </aside>

      {/* Backdrop para móvil */}
      {open && <div className="mobile-backdrop" onClick={() => setOpen(false)}/>}
    </>
  );
};

// =================== Hub (pantalla principal con iconos grandes) ===================
const HUB_TILES = [
  { id: "dashboard",   label: "Dashboard",          desc: "Resumen y KPIs",                color: "#1E5BD9", soft: "#DCE7FB", icon: "chart" },
  { id: "inventory",   label: "Inventario",         desc: "Productos y stock",             color: "#0F766E", soft: "#CCFBF1", icon: "box" },
  { id: "ingreso",     label: "Ingreso mercancía",  desc: "Recepción a bodega",            color: "#9333EA", soft: "#F3E8FF", icon: "truck" },
  { id: "vence",       label: "Vencimientos",       desc: "Alertas y umbrales",            color: "#EA580C", soft: "#FFEDD5", icon: "calendar" },
  { id: "proveedores", label: "Proveedores",        desc: "Directorio comercial",          color: "#0891B2", soft: "#CFFAFE", icon: "store" },
  { id: "cajeros",     label: "Cajeros y turnos",   desc: "Personal y aperturas",          color: "#DB2777", soft: "#FCE7F3", icon: "users" },
  { id: "reportes",    label: "Reporte de ventas",  desc: "Análisis filtrable",            color: "#CA8A04", soft: "#FEF3C7", icon: "chart" },
];

const Hub = ({ go, user }) => (
  <div className="hub">
    <div className="hub-h">
      <h1>Hola, {(user && user.nombre) ? user.nombre.split(" ")[0] : "admin"} 👋</h1>
    </div>
    <div className="hub-grid">
      {HUB_TILES.map(t => (
        <button key={t.id} className="hub-tile filled" onClick={() => go(t.id)}
          style={{ "--tile-color": t.color, "--tile-soft": t.soft }}>
          <div className="hub-tile-icon"><Icon name={t.icon} size={32}/></div>
          <div className="hub-tile-label">{t.label}</div>
          <div className="hub-tile-desc">{t.desc}</div>
          <div className="hub-tile-arrow"><Icon name="arrowRight" size={16}/></div>
        </button>
      ))}
    </div>
  </div>
);

// =================== Dashboard ===================
const Dashboard = ({ go }) => {
  const sparkData = MOCK.ventasHoy.map(h => h.v);
  const totalHoy = MOCK.ventasHoy.reduce((s, h) => s + h.v, 0);
  const ventasCajeroHoy = MOCK.ventasCajero.map(c => ({ ...c, hoy: Math.round(c.total / 30 * (0.6 + Math.random()*0.8)) }));
  const maxHora = Math.max(...MOCK.ventasHoy.map(h => h.v));
  const horaPico = MOCK.ventasHoy.find(h => h.v === maxHora);

  return (
    <div className="dash">
      <div className="page-h dash-h">
        <div>
          <h2>Buen día, admin</h2>
          <p className="sub">Resumen de hoy — viernes 8 de mayo, 2026</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportXlsx("InvenPro_resumen_hoy.xlsx", [
            { name: "KPIs hoy", rows: [
              { Métrica: "Ventas hoy", Valor: totalHoy },
              { Métrica: "Transacciones", Valor: 98 },
              { Métrica: "Ticket promedio", Valor: 29200 },
              { Métrica: "Alertas", Valor: 12 },
            ]},
            { name: "Ventas por hora", rows: MOCK.ventasHoy.map(h => ({ Hora: h.h + ":00", Total: h.v })) },
            { name: "Ventas por cajero (hoy)", rows: ventasCajeroHoy.map(c => ({ Cajero: c.nombre, Total: c.hoy })) },
          ])}><Icon name="download" size={14}/> Exportar</button>
        </div>
      </div>

      <div className="kpi-grid dash-kpi tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi">
          <div className="label"><Icon name="cart" size={13}/> Ventas hoy</div>
          <div className="val">{window.fmtCOP(totalHoy)}</div>
          <div className="delta up"><Icon name="arrowUp" size={11}/> +12.4% vs ayer</div>
          <div className="spark"><Spark data={sparkData} color="var(--accent)"/></div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="users" size={13}/> Transacciones</div>
          <div className="val">98</div>
          <div className="delta up"><Icon name="arrowUp" size={11}/> +6 vs ayer</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="clock" size={13}/> Hora pico</div>
          <div className="val">{horaPico.h}:00</div>
          <div className="delta">{window.fmtCOP(horaPico.v)} facturados</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="alert" size={13}/> Alertas activas</div>
          <div className="val">12</div>
          <div className="delta">5 por vencer · 7 stock bajo</div>
        </div>
      </div>

      <div className="dash-row tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.4fr_1fr] tw-gap-[10px]">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Ventas por hora · hoy</h3>
              <p className="sub">Distribución del día en curso</p>
            </div>
          </div>
          <div className="card-b">
            <div className="chart-bars">
              {MOCK.ventasHoy.map((h, i) => {
                const pct = (h.v/maxHora)*100;
                const isPico = h.v === maxHora;
                return (
                  <div key={h.h} className="col">
                    <div className="bar-wrap">
                      <div className="val mono">{(h.v/1000).toFixed(0)}k</div>
                      <div className={"bar" + (isPico ? "" : " alt")} style={{ height: `${pct}%`, animationDelay: `${i*50}ms` }}/>
                    </div>
                    <div className="lbl">{h.h}h</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div><h3>Cajeros en turno · hoy</h3><p className="sub">Ventas acumuladas</p></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {ventasCajeroHoy.sort((a,b)=>b.hoy-a.hoy).map((c, i) => {
                  const max = Math.max(...ventasCajeroHoy.map(x => x.hoy));
                  return (
                    <tr key={c.id}>
                      <td style={{ width: 28, color: "var(--text-3)" }} className="mono">{i+1}</td>
                      <td>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{c.nombre}</div>
                        <div className="progress"><span style={{ width: `${(c.hoy/max)*100}%` }}/></div>
                      </td>
                      <td className="num mono">{window.fmtCOP(c.hoy)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== Inventario (Bodega unificada) ===================
const Inventario = () => {
  const [q, setQ] = useStateA("");
  const [cat, setCat] = useStateA("Todos");
  const [estado, setEstado] = useStateA("Todos");
  const [toast, setToast] = useStateA(null);
  const [productos, setProductos] = useStateA(() => MOCK.productos.map(p => ({ ...p })));
  const [barcodeInputs, setBarcodeInputs] = useStateA({});
  const [editing, setEditing] = useStateA(null); // null | producto
  const [saving, setSaving] = useStateA(false);

  const sinCodigo = useMemoA(() => productos.filter(p => !p.codigoBarras).length, [productos]);
  const bajo = useMemoA(() => productos.filter(p => p.stock < p.min).length, [productos]);
  const totalValor = useMemoA(() => productos.reduce((s, p) => s + p.stock * p.costo, 0), [productos]);
  const totalStock = useMemoA(() => productos.reduce((s, p) => s + p.stock, 0), [productos]);

  const rows = useMemoA(() => {
    let list = productos;
    if (cat !== "Todos") list = list.filter(p => p.categoria === cat);
    if (q) {
      const qq = q.toLowerCase().trim();
      list = list.filter(p => p.nombre.toLowerCase().includes(qq) || p.sku.toLowerCase().includes(qq) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(qq)));
    }
    if (estado === "Bajo") list = list.filter(p => p.stock < p.min);
    if (estado === "Sin stock") list = list.filter(p => p.stock === 0);
    if (estado === "Sin código") list = list.filter(p => !p.codigoBarras);
    // Productos sin código primero
    return [...list].sort((a, b) => (a.codigoBarras ? 1 : 0) - (b.codigoBarras ? 1 : 0));
  }, [productos, q, cat, estado]);

  const pag = usePagination(rows, 10);

  const asignarCodigo = async (sku) => {
    const codigo = (barcodeInputs[sku] || "").trim();
    if (!codigo) { setToast("Escanea o digita un código de barras"); return; }
    const existente = productos.find(p => p.codigoBarras === codigo);
    if (existente) { setToast(`Este código ya está asignado a "${existente.nombre}" (${existente.sku})`); return; }
    const err = await DB.updateCodigoBarras(sku, codigo);
    if (err) { setToast("Error al guardar: " + (err.message || "Intenta de nuevo")); return; }
    setProductos(ps => ps.map(p => p.sku === sku ? { ...p, codigoBarras: codigo } : p));
    const mp = MOCK.productos.find(p => p.sku === sku);
    if (mp) mp.codigoBarras = codigo;
    setBarcodeInputs(prev => { const next = { ...prev }; delete next[sku]; return next; });
    setToast("Código de barras asignado correctamente");
  };

  const guardarProducto = async (draft) => {
    setSaving(true);
    // Validar código de barras único
    if (draft.codigoBarras) {
      const dup = productos.find(p => p.codigoBarras === draft.codigoBarras && p.sku !== draft.sku);
      if (dup) { setToast(`Código de barras ya asignado a "${dup.nombre}"`); setSaving(false); return; }
    }
    const err = await DB.updateProducto(draft.sku, {
      nombre: draft.nombre,
      categoria: draft.categoria,
      precio: draft.precio,
      costo: draft.costo,
      stock: draft.stock,
      min: draft.min,
      unidad: draft.unidad,
      vence: draft.vence || null,
      codigoBarras: draft.codigoBarras || null,
    });
    if (err) { setToast("Error al guardar: " + (err.message || "Intenta de nuevo")); setSaving(false); return; }
    // Actualizar local
    setProductos(ps => ps.map(p => p.sku === draft.sku ? { ...p, ...draft } : p));
    const mp = MOCK.productos.find(p => p.sku === draft.sku);
    if (mp) Object.assign(mp, draft);
    setEditing(null);
    setSaving(false);
    setToast("Producto actualizado");
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Inventario / Bodega</h2>
          <p className="sub">{productos.length} productos · {bajo} con stock bajo · valor en bodega {window.fmtCOP(totalValor)}</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportXlsx("InvenPro_inventario.xlsx", [
            { name: "Inventario", rows: rows.map(p => ({
              SKU: p.sku, "Código de barras": p.codigoBarras || "", Producto: p.nombre, Categoría: p.categoria,
              Precio: p.precio, Costo: p.costo, Stock: p.stock, Mínimo: p.min, Unidad: p.unidad, Vence: p.vence || ""
            })) },
          ])}><Icon name="download" size={14}/> Exportar Excel</button>
        </div>
      </div>

      <div className="kpi-grid tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Todos" ? "var(--accent)" : undefined, background: estado === "Todos" ? "var(--accent-soft)" : undefined }} onClick={() => setEstado("Todos")}>
          <div className="label"><Icon name="box" size={14}/> Total productos</div>
          <div className="val">{productos.length}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Sin código" ? "#F59E0B" : undefined, background: estado === "Sin código" ? "var(--warn-soft)" : undefined }} onClick={() => setEstado(estado === "Sin código" ? "Todos" : "Sin código")}>
          <div className="label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Sin código de barras</div>
          <div className="val" style={{ color: sinCodigo > 0 ? "#F59E0B" : "var(--good)" }}>{sinCodigo}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Bajo" ? "var(--bad)" : undefined, background: estado === "Bajo" ? "var(--bad-soft)" : undefined }} onClick={() => setEstado(estado === "Bajo" ? "Todos" : "Bajo")}>
          <div className="label"><Icon name="alert" size={14}/> Stock bajo</div>
          <div className="val" style={{ color: bajo > 0 ? "var(--bad)" : "var(--good)" }}>{bajo}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Sin stock" ? "var(--bad)" : undefined, background: estado === "Sin stock" ? "var(--bad-soft)" : undefined }} onClick={() => setEstado(estado === "Sin stock" ? "Todos" : "Sin stock")}>
          <div className="label"><Icon name="truck" size={14}/> Stock total</div>
          <div className="val">{totalStock.toLocaleString("es-CO")}</div>
          {estado === "Sin stock" && <div className="muted" style={{ fontSize: 10 }}>Filtrando: sin stock</div>}
        </div>
      </div>

      <div className="filterbar">
        <div className="search">
          <Icon name="search" size={16}/>
          <input placeholder="Buscar por código de barras, nombre o SKU…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <div className="select-pill">
          <span className="lbl">Categoría</span>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option>Todos</option>
            {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="select-pill">
          <span className="lbl">Estado</span>
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option>Todos</option>
            <option>Bajo</option>
            <option>Sin stock</option>
            <option>Sin código</option>
          </select>
        </div>
      </div>

      {/* Desktop: tabla normal */}
      <div className="tw-hidden md:tw-block">
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl tbl-bodega">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="num">Precio</th>
                  <th>Stock</th>
                  <th>Código de barras</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map(p => {
                  const stockPct = Math.min(100, (p.stock / (Math.max(p.min, 1) * 3)) * 100);
                  const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
                  return (
                    <tr key={p.sku} className={!p.codigoBarras ? "row-sin-codigo" : "row-hover"}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                        <div className="mono muted" style={{ fontSize: 11 }}>{p.sku}</div>
                      </td>
                      <td><span className="chip">{p.categoria}</span></td>
                      <td className="num mono">{window.fmtCOP(p.precio)}</td>
                      <td style={{ minWidth: 130 }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                          <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                        </div>
                        <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }}/></div>
                      </td>
                      <td>
                        {p.codigoBarras ? (
                          <span className="mono" style={{ fontSize: 12 }}>{p.codigoBarras}</span>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              className="bodega-barcode-input mono"
                              value={barcodeInputs[p.sku] || ""}
                              onChange={e => setBarcodeInputs(prev => ({ ...prev, [p.sku]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") asignarCodigo(p.sku); }}
                              placeholder="Escanear código…"
                            />
                            <button className="btn sm primary" onClick={() => asignarCodigo(p.sku)} disabled={!(barcodeInputs[p.sku] || "").trim()}>
                              <Icon name="check" size={13}/>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="num">
                        <button className="btn sm ghost" onClick={() => setEditing({ ...p })} title="Ver / editar"><Icon name="eye" size={13}/></button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan="6"><div className="empty-state">Sin productos con los filtros aplicados.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...pag} label="productos"/>
        </div>
      </div>

      {/* Mobile: tarjetas con Tailwind */}
      <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-3">
        {pag.slice.map(p => {
          const stockPct = Math.min(100, (p.stock / (Math.max(p.min, 1) * 3)) * 100);
          const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
          return (
            <div key={p.sku} className={
              "tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm"
              + (!p.codigoBarras ? " tw-border-l-[3px] tw-border-l-amber-400" : "")
            }>
              <div className="tw-flex tw-justify-between tw-items-start tw-mb-2">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{p.nombre}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{p.sku}</div>
                </div>
                <button className="btn sm ghost" onClick={() => setEditing({ ...p })} title="Ver / editar"><Icon name="eye" size={13}/></button>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                <span className="chip">{p.categoria}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{window.fmtCOP(p.precio)}</span>
              </div>
              <div className="tw-mb-2">
                <div className="tw-flex tw-justify-between tw-mb-1">
                  <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                </div>
                <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }}/></div>
              </div>
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, marginTop: 6 }}>
                {p.codigoBarras ? (
                  <span className="mono" style={{ fontSize: 12 }}>{p.codigoBarras}</span>
                ) : (
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <input
                      className="bodega-barcode-input mono"
                      value={barcodeInputs[p.sku] || ""}
                      onChange={e => setBarcodeInputs(prev => ({ ...prev, [p.sku]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") asignarCodigo(p.sku); }}
                      placeholder="Escanear código…"
                      style={{ width: "100%", minHeight: 44, fontSize: 16 }}
                    />
                    <button className="btn sm primary" style={{ width: "100%", justifyContent: "center", minHeight: 44 }} onClick={() => asignarCodigo(p.sku)} disabled={!(barcodeInputs[p.sku] || "").trim()}>
                      <Icon name="check" size={13}/> Asignar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="empty-state">Sin productos con los filtros aplicados.</div>
        )}
        <Pagination {...pag} label="productos"/>
      </div>

      {editing && <ProductoEditModal
        producto={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={guardarProducto}
      />}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

const ProductoEditModal = ({ producto, saving, onClose, onSave }) => {
  const [d, setD] = useStateA({ ...producto });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const venceDays = d.vence ? window.daysFromNow(d.vence) : null;

  return (
    <Modal title="Editar producto" lg onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving || !d.nombre} onClick={() => onSave(d)}>
          <Icon name="check" size={14}/> {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </>
    }>
      <div style={{ padding: "8px 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>
          {d.nombre ? d.nombre.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{d.nombre || "Producto"}</div>
          <div className="mono muted" style={{ fontSize: 11 }}>{d.sku}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Nombre *</label>
          <input value={d.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del producto"/></div>
        <div className="field"><label>Categoría</label>
          <select value={d.categoria} onChange={e => set("categoria", e.target.value)}>
            {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
            <option value="General">General</option>
          </select></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Precio de venta</label>
          <input className="mono" type="number" min="0" value={d.precio} onChange={e => set("precio", parseInt(e.target.value) || 0)}/></div>
        <div className="field"><label>Costo</label>
          <input className="mono" type="number" min="0" value={d.costo} onChange={e => set("costo", parseInt(e.target.value) || 0)}/></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Stock actual</label>
          <input className="mono" type="number" min="0" value={d.stock} onChange={e => set("stock", parseInt(e.target.value) || 0)}/></div>
        <div className="field"><label>Stock mínimo</label>
          <input className="mono" type="number" min="0" value={d.min} onChange={e => set("min", parseInt(e.target.value) || 0)}/></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Unidad</label>
          <select value={d.unidad} onChange={e => set("unidad", e.target.value)}>
            <option value="und">und</option><option value="kg">kg</option><option value="g">g</option>
            <option value="lb">lb</option><option value="lt">lt</option><option value="ml">ml</option>
            <option value="paq">paq</option><option value="caja">caja</option>
          </select></div>
        <div className="field"><label>Vencimiento</label>
          <input type="date" value={d.vence || ""} onChange={e => set("vence", e.target.value || null)}/>
          {venceDays !== null && venceDays <= 14 && (
            <span className={"chip mt-1 " + (venceDays <= 5 ? "bad" : "warn")} style={{ fontSize: 10 }}>
              {venceDays <= 0 ? "Vencido" : `Vence en ${venceDays} días`}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label>Código de barras</label>
        <input className="mono bodega-barcode-input" style={{ width: "100%" }} value={d.codigoBarras || ""} onChange={e => set("codigoBarras", e.target.value || null)} placeholder="Escanear o digitar código de barras…"/>
        {!d.codigoBarras && <span className="muted" style={{ fontSize: 11, marginTop: 4, display: "block" }}>Puedes asignarlo ahora o después desde la tabla.</span>}
      </div>

      {d.precio > 0 && d.costo > 0 && (
        <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
          <span className="muted">Margen de ganancia</span>
          <span className="mono" style={{ fontWeight: 600 }}>{Math.round(((d.precio - d.costo) / d.costo) * 100)}%</span>
        </div>
      )}
    </Modal>
  );
};

// =================== Ingreso de mercancía ===================
// Datos simulados que devolvería la lectura del QR DIAN
const MOCK_QR_DIAN = {
  proveedor: "Distribuidora El Sol",
  nit: "900.124.567-8",
  factura: "FE-2026-001284",
  cufe: "8b3f9c2e1a7d4f6e9c2a8b3f...",
  fecha: "2026-05-22 10:42",
  vendedor: "Carlos Pérez",
  celular: "300 123 4567",
  items: [
    { sku: "7702001", nombre: "Leche entera 1L",     qty: 48, costo: 3200, vence: "2026-06-18", encontrado: true },
    { sku: "7720001", nombre: "Arroz blanco 1kg",    qty: 30, costo: 3700, vence: "2027-04-15", encontrado: true },
    { sku: "7730001", nombre: "Aceite girasol 1L",   qty: 20, costo: 11000, vence: "2026-10-05", encontrado: true },
    { sku: "7760001", nombre: "Huevos AA x12",       qty: 15, costo: 10500, vence: "2026-06-12", encontrado: true },
  ],
};

// Datos simulados que devolvería el OCR + IA al escanear la foto
const MOCK_OCR_IA = {
  proveedor: "Lácteos del Valle",
  nit: "830.998.221-2",
  factura: "LV-8821",
  fecha: "2026-05-22 11:15",
  vendedor: "María González",
  celular: "320 555 7788",
  items: [
    { sku: "7702002", nombre: "Yogurt natural 1L",    qty: 20, costo: 5500, vence: "2026-06-15", encontrado: true,  confianza: 0.96 },
    { sku: null,      nombre: "Queso Campesino 500g", qty: 12, costo: 9800, vence: "2026-06-08", encontrado: false, confianza: 0.91, nuevo: true },
    { sku: "7702004", nombre: "Mantequilla 250g",     qty: 18, costo: 4200, vence: "2026-08-20", encontrado: true,  confianza: 0.88 },
  ],
};

const Ingreso = () => {
  const [items, setItems] = useStateA([]);
  const [origen, setOrigen] = useStateA(null); // null | "manual" | "qr" | "ia"
  const [showSelector, setShowSelector] = useStateA(false);
  const [showIaScanner, setShowIaScanner] = useStateA(false);
  const [showForm, setShowForm] = useStateA(false);
  const [verIngreso, setVerIngreso] = useStateA(null);
  const hoy = new Date().toISOString().slice(0,10);
  const hace30 = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
  const [desde, setDesde] = useStateA(hace30);
  const [hasta, setHasta] = useStateA(hoy);
  const [proveedores, setProveedores] = useStateA([
    { nombre: "Distribuidora El Sol", nit: "900.124.567-8", tel: "(4) 444 1820" },
    { nombre: "Lácteos del Valle", nit: "830.998.221-2", tel: "(2) 660 1245" },
    { nombre: "Frutiverduras Mayor", nit: "901.445.118-3", tel: "(1) 320 7790" },
    { nombre: "Aseo y Hogar S.A.S", nit: "900.778.412-1", tel: "(4) 511 8900" },
  ]);
  const [proveedor, setProveedor] = useStateA("Distribuidora El Sol");
  const [factura, setFactura] = useStateA("FV-" + Math.floor(Math.random()*9000+1000));
  const [vendedor, setVendedor] = useStateA("");
  const [celular, setCelular] = useStateA("");
  const [recibido, setRecibido] = useStateA(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  });
  const [showProv, setShowProv] = useStateA(false);
  const [provDraft, setProvDraft] = useStateA({ nombre: "", nit: "", tel: "" });
  const [toast, setToast] = useStateA(null);
  const [guardando, setGuardando] = useStateA(false);
  const ingresosFiltrados = MOCK.ingresos.filter(i => i.fecha >= desde && i.fecha <= hasta);
  const pagIng = usePagination(ingresosFiltrados, 10);

  const add = (sku, qty, costo, vence, nombreManual) => {
    const p = MOCK.productos.find(x => x.sku === sku);
    const esNuevo = !p;
    const nombre = p ? p.nombre : (nombreManual || sku);
    const item = { sku, nombre, qty: parseInt(qty)||0, costo: parseInt(costo)||0, vence, nuevo: esNuevo };
    if (esNuevo) {
      item.categoria = "General";
      item.precio = Math.round((parseInt(costo)||0) * 1.3);
    }
    setItems(it => [...it, item]);
  };

  const actualizarItem = (idx, campo, valor) => {
    setItems(it => it.map((x, i) => i === idx ? { ...x, [campo]: valor } : x));
  };

  // Aplica los datos extraídos (QR o IA) al formulario y abre la confirmación
  const aplicarDatosExtraidos = (data, modo) => {
    const existeProv = proveedores.find(p => p.nit === data.nit);
    if (!existeProv) {
      setProveedores(ps => [...ps, { nombre: data.proveedor, nit: data.nit, tel: "" }]);
    }
    setProveedor(data.proveedor);
    setFactura(data.factura);
    setVendedor(data.vendedor || "");
    setCelular(data.celular || "");
    setItems(data.items.map(it => {
      const esNuevo = !!it.nuevo || !it.encontrado;
      return {
        sku: it.sku || ("NUEVO-" + Math.floor(Math.random()*9999)),
        nombre: it.nombre,
        qty: it.qty,
        costo: it.costo,
        vence: it.vence,
        nuevo: esNuevo,
        confianza: it.confianza,
        categoria: esNuevo ? "General" : undefined,
        precio: esNuevo ? Math.round((it.costo || 0) * 1.3) : undefined,
      };
    }));
    setOrigen(modo);
    setShowIaScanner(false);
    setShowForm(true);
  };

  const iniciarManual = () => {
    setItems([]); setVendedor(""); setCelular("");
    setFactura(""); setProveedor("");
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setRecibido(d.toISOString().slice(0,16));
    setOrigen("manual");
    setShowSelector(false);
    setShowForm(true);
  };

  const total = items.reduce((s, i) => s + i.qty * i.costo, 0);

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Ingreso de mercancía</h2>
          <p className="sub">Registra entradas a la bodega y actualiza inventario y costos.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setShowSelector(true)}><Icon name="plus" size={14}/> Nuevo ingreso</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-h" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3>Historial de ingresos</h3>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <div className="row" style={{ gap: 6, alignItems: "center" }}>
              <span className="muted" style={{ fontSize: 12 }}>Desde</span>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ width: 145 }}/>
              <span className="muted" style={{ fontSize: 12 }}>Hasta</span>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ width: 145 }}/>
            </div>
            <button className="btn" onClick={() => {
              const ings = MOCK.ingresos.filter(i => i.fecha >= desde && i.fecha <= hasta);
              if (ings.length === 0) { setToast("No hay ingresos en ese rango"); return; }
              const resumen = ings.map(i => ({
                "N° ingreso": i.id, "Fecha": i.fecha, "Proveedor": i.proveedor,
                "Factura": i.factura || "", "Items": i.items,
                "Costo total": i.costo, "Recibido por": i.recibe,
              }));
              const detalle = ings.flatMap(i => (i.detalle || []).map(d => ({
                "N° ingreso": i.id, "Fecha": i.fecha, "Proveedor": i.proveedor,
                "Factura": i.factura || "", "SKU": d.sku, "Producto": d.nombre,
                "Cantidad": d.qty, "Costo unit.": d.costo, "Subtotal": d.qty * d.costo,
                "Vence": d.vence || "",
              })));
              exportXlsx(`ingresos_${desde}_a_${hasta}.xlsx`, [
                { name: "Resumen", rows: resumen },
                { name: "Detalle", rows: detalle },
              ]);
              setToast(`${ings.length} ingreso(s) exportados`);
            }}><Icon name="download" size={14}/> Exportar Excel</button>
          </div>
        </div>
        {/* Desktop: tabla */}
        <div className="tw-hidden md:tw-block">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>N° ingreso</th><th>Factura</th><th>Fecha</th><th>Proveedor</th><th className="num">Items</th><th className="num">Costo total</th><th>Recibido por</th><th></th></tr></thead>
              <tbody>
                {pagIng.slice.map(i => (
                  <tr key={i.id} className="row-hover" style={{ cursor: "pointer" }} onClick={() => setVerIngreso(i)}>
                    <td className="mono">{i.id}</td>
                    <td className="mono">{i.factura || "—"}</td>
                    <td>{i.fecha}</td>
                    <td>{i.proveedor}</td>
                    <td className="num mono">{i.items}</td>
                    <td className="num mono">{window.fmtCOP(i.costo)}</td>
                    <td className="muted">{i.recibe}</td>
                    <td className="num"><button className="btn sm ghost" onClick={e => { e.stopPropagation(); setVerIngreso(i); }}><Icon name="eye" size={13}/></button></td>
                  </tr>
                ))}
                {ingresosFiltrados.length === 0 && (
                  <tr><td colSpan="8" className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ingresos en el rango seleccionado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Mobile: tarjetas */}
        <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5" style={{ padding: "0 2px 4px" }}>
          {pagIng.slice.map(i => (
            <div key={i.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm" style={{ cursor: "pointer" }} onClick={() => setVerIngreso(i)}>
              <div className="tw-flex tw-justify-between tw-items-start tw-mb-1.5">
                <div>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{i.id}</span>
                  {i.factura && <span className="mono muted" style={{ fontSize: 11, marginLeft: 8 }}>{i.factura}</span>}
                </div>
                <span className="muted" style={{ fontSize: 11 }}>{i.fecha}</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{i.proveedor}</div>
              <div className="tw-flex tw-justify-between tw-items-center tw-pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
                <span className="muted" style={{ fontSize: 11 }}>{i.items} items · {i.recibe}</span>
                <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{window.fmtCOP(i.costo)}</span>
              </div>
            </div>
          ))}
          {ingresosFiltrados.length === 0 && (
            <div className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ingresos en el rango seleccionado</div>
          )}
        </div>
        <Pagination {...pagIng} label="ingresos"/>
      </div>

      {verIngreso && (() => {
        const [editIng, setEditIng] = [verIngreso, setVerIngreso];
        const editDet = editIng.detalle || [];
        const editTotal = editDet.reduce((s, d) => s + d.qty * d.costo, 0);
        const updField = (k, v) => setVerIngreso({ ...editIng, [k]: v });
        const updDet = (idx, k, v) => setVerIngreso({ ...editIng, detalle: editDet.map((d, i) => i === idx ? { ...d, [k]: v } : d) });
        return (
        <Modal title={`Ingreso ${editIng.id}`} lg onClose={() => setVerIngreso(null)} footer={
          <>
            <button className="btn ghost" onClick={() => setVerIngreso(null)}>Cancelar</button>
            <button className="btn" onClick={() => {
              const rows = editDet.map(d => ({
                SKU: d.sku, Producto: d.nombre, Cantidad: d.qty,
                "Costo unit.": d.costo, Subtotal: d.qty * d.costo, Vence: d.vence || "",
              }));
              exportXlsx(`ingreso_${editIng.id}.xlsx`, [{ name: "Detalle", rows }]);
            }}><Icon name="download" size={14}/> Exportar</button>
            <button className="btn primary" disabled={guardando} onClick={async () => {
              setGuardando(true);
              const err = await DB.updateIngreso(editIng.id, editIng, editDet);
              if (err) { setToast("Error al guardar"); setGuardando(false); return; }
              await hydrateData();
              setVerIngreso(null);
              setGuardando(false);
              setToast("Ingreso actualizado");
            }}><Icon name="check" size={14}/> {guardando ? "Guardando…" : "Guardar cambios"}</button>
          </>
        }>
          <div className="grid-2" style={{ marginBottom: 12, gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Proveedor</label>
              <input value={editIng.proveedor} onChange={e => updField("proveedor", e.target.value)}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>N° Factura</label>
              <input className="mono" value={editIng.factura || ""} onChange={e => updField("factura", e.target.value)}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha</label>
              <input className="mono" value={editIng.fecha} readOnly style={{ background: "var(--surface-2)", color: "var(--text-3)" }}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Recibido por</label>
              <input value={editIng.recibe || ""} onChange={e => updField("recibe", e.target.value)}/>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Producto</th><th>SKU</th><th className="num">Cant.</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {editDet.map((d, i) => (
                  <tr key={i}>
                    <td><input value={d.nombre} onChange={e => updDet(i, "nombre", e.target.value)} style={{ fontWeight: 500, border: "1px solid transparent", background: "transparent", padding: "2px 4px", borderRadius: 4, fontSize: 13, width: "100%", minWidth: 100 }} onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; }} onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}/></td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{d.sku}</td>
                    <td className="num"><input className="cell-input mono" value={d.qty} onChange={e => updDet(i, "qty", parseInt(e.target.value.replace(/\D/g, "")) || 0)}/></td>
                    <td className="num"><input className="cell-input mono" value={d.costo} onChange={e => updDet(i, "costo", parseInt(e.target.value.replace(/\D/g, "")) || 0)}/></td>
                    <td><input className="cell-input mono" type="date" value={d.vence || ""} onChange={e => updDet(i, "vence", e.target.value)}/></td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(d.qty * d.costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", background: "var(--surface-2)", marginTop: 8, borderRadius: 8 }}>
            <span className="muted">{editDet.length} producto(s) · {editDet.reduce((s,d)=>s+d.qty,0)} unidades</span>
            <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(editTotal)}</span>
          </div>
        </Modal>
        );
      })()}

      {showSelector && (
        <Modal title="¿Cómo deseas registrar el ingreso?" lg onClose={() => setShowSelector(false)}>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
            Selecciona el método de captura. En cualquiera podrás revisar y editar los datos antes de guardar.
          </p>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
            <button className="method-card" onClick={iniciarManual}>
              <div className="method-icon" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}><Icon name="edit" size={24}/></div>
              <div className="method-title">Manual</div>
              <div className="method-desc">Captura los datos uno por uno desde el formulario.</div>
              <div className="method-tag">Tradicional</div>
            </button>
            <button className="method-card" onClick={() => { setShowSelector(false); setShowIaScanner(true); }}>
              <div className="method-icon" style={{ background: "#FFF1D6", color: "#8C6A1E" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="method-title">Fotografiar factura</div>
              <div className="method-desc">Toma una foto de la factura física y la IA extrae los datos automáticamente.</div>
              <div className="method-tag warn">Con IA</div>
            </button>
          </div>
        </Modal>
      )}

      {showIaScanner && (
        <IaScannerModal onClose={() => setShowIaScanner(false)} onRead={(data) => aplicarDatosExtraidos(data, "ia")}/>
      )}

      {showForm && (() => {
        const provActual = proveedores.find(x => x.nombre === proveedor);
        const existentes = items.filter(it => !it.nuevo);
        const nuevos = items.filter(it => it.nuevo);
        const getStock = (sku) => { const p = MOCK.productos.find(x => x.sku === sku); return p ? p.stock : null; };
        return (
        <Modal title="Confirmar ingreso de mercancía" lg onClose={() => { setShowForm(false); setOrigen(null); }} footer={
          <>
            <button className="btn ghost" onClick={() => { setShowForm(false); setOrigen(null); }}>Cancelar</button>
            <button className="btn accent" disabled={guardando || items.length === 0} onClick={async () => {
              // Validar factura única
              const yaExiste = MOCK.ingresos.find(i => i.factura === factura && i.proveedor === proveedor);
              if (yaExiste) {
                setToast("Esta factura ya fue registrada para este proveedor");
                return;
              }
              // Bloquear doble clic
              setGuardando(true);
              try {
                // Crear productos nuevos con SKU auto-generado
                const nuevos = items.filter(it => it.nuevo);
                for (const it of nuevos) {
                  const autoSku = DB.generateSku();
                  it.sku = autoSku;
                  const err = await DB.createProducto({
                    sku: autoSku,
                    nombre: it.nombre,
                    categoria: it.categoria || "General",
                    precio: it.precio || Math.round(it.costo * 1.3),
                    costo: it.costo,
                    stock: 0,
                    vence: it.vence || null,
                    codigoBarras: null,
                  });
                  if (err) { setToast("Error creando producto: " + it.nombre); setGuardando(false); return; }
                  // Agregar al MOCK local para que generateSku no repita
                  MOCK.productos.push({ sku: autoSku, nombre: it.nombre, categoria: it.categoria || "General", precio: it.precio || 0, costo: it.costo, stock: 0, min: 0, vence: it.vence || null, unidad: "und", codigoBarras: null });
                }
                // Incrementar stock de todos los items
                for (const it of items) {
                  await DB.incrementStock(it.sku, it.qty);
                }
                // Registrar ingreso
                const ingreso = {
                  id: "ING-" + Date.now(),
                  fecha: new Date().toISOString().slice(0, 10),
                  proveedor: proveedor,
                  items: items.length,
                  costo: total,
                  recibe: "Administrador",
                  factura: factura,
                };
                await DB.createIngreso(ingreso, items);
                await hydrateData();
                setShowForm(false); setItems([]); setVendedor(""); setCelular(""); setOrigen(null);
                setToast("Ingreso registrado · " + nuevos.length + " producto(s) creado(s) · stock actualizado. Asigna códigos de barras en Bodega.");
              } catch (e) {
                setToast("Error al guardar: " + e.message);
              }
              setGuardando(false);
            }}><Icon name="check"/> {guardando ? "Guardando…" : "Confirmar ingreso"}</button>
          </>
        }>
          {origen && origen !== "manual" && (
            <div className={"origen-banner " + origen}>
              <div className="row" style={{ gap: 10 }}>
                <div className="origen-icon">
                  {origen === "qr" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ) : (
                    <Icon name="check" size={18}/>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {origen === "qr" ? "Datos importados desde QR DIAN" : "Datos extraídos por IA desde la foto"}
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {origen === "qr"
                      ? "Información validada por la DIAN. Verifica antes de confirmar."
                      : "Revisa la información extraída. Los campos con baja confianza están marcados."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Datos del proveedor ── */}
          <div className="card" style={{ padding: 16, marginBottom: 14, border: "1px solid var(--border)", background: "var(--surface-2)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Icon name="store" size={16}/>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Datos del proveedor</span>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Proveedor</label>
                <select value={proveedor} onChange={e => setProveedor(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {proveedores.map(p => <option key={p.nit}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>NIT / Identificación</label>
                <input className="mono" value={provActual ? provActual.nit : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, nit: e.target.value } : p));
                }} placeholder="900.000.000-0"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Teléfono</label>
                <input className="mono" value={provActual ? provActual.tel : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, tel: e.target.value.replace(/[^\d\s+()-]/g,"") } : p));
                }} placeholder="(4) 444 1820"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Dirección</label>
                <input value={provActual ? (provActual.direccion || "") : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, direccion: e.target.value } : p));
                }} placeholder="Cra 50 #30-20, Medellín"/>
              </div>
            </div>
          </div>

          {/* ── Datos de la factura ── */}
          <div className="card" style={{ padding: 16, marginBottom: 14, border: "1px solid var(--border)", background: "var(--surface-2)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Datos de la factura</span>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>N° factura proveedor</label>
                <input className="mono" value={factura} onChange={e => setFactura(e.target.value)}/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Fecha y hora de recibo</label>
                <input type="datetime-local" value={recibido} onChange={e => setRecibido(e.target.value)}/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Nombre del vendedor</label>
                <input value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Ej: Carlos Pérez"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Celular vendedor</label>
                <input className="mono" value={celular} onChange={e => setCelular(e.target.value.replace(/[^\d\s+()-]/g,""))} placeholder="300 123 4567"/>
              </div>
            </div>
          </div>

          {/* ── Resumen de items ── */}
          {items.length > 0 && (origen === "ia" || origen === "qr") && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="check" size={16}/>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#065F46" }}>{existentes.length} en bodega</div>
                  <div style={{ fontSize: 11, color: "#047857" }}>Se actualizará el stock</div>
                </div>
              </div>
              {nuevos.length > 0 && (
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#9A3412" }}>{nuevos.length} nuevo(s)</div>
                    <div style={{ fontSize: 11, color: "#C2410C" }}>Se agregarán al inventario</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {nuevos.length > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="box" size={16}/>
              <span style={{ fontSize: 12, color: "#9A3412" }}>Los productos nuevos se crearán con SKU automático. Podrás asignar el código de barras después en <strong>Bodega</strong>.</span>
            </div>
          )}

          <ItemAdder onAdd={add}/>

          {items.length > 0 && (
            <div className="card mt-2">
              {/* Desktop: tabla */}
              <div className="tw-hidden md:tw-block">
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Producto</th><th className="num">Stock actual</th><th className="num">Cantidad</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {items.map((it, i) => {
                        const stockActual = getStock(it.sku);
                        return (
                        <tr key={i} className={it.nuevo ? "row-nuevo" : ""}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input
                                value={it.nombre}
                                onChange={e => actualizarItem(i, "nombre", e.target.value)}
                                style={{ fontWeight: 500, border: "1px solid transparent", background: "transparent", color: "var(--text)", padding: "2px 4px", borderRadius: 4, fontSize: 13, width: "100%", minWidth: 120 }}
                                onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; }}
                                onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                              {!it.nuevo && <span className="muted mono" style={{ fontSize: 11 }}>{it.sku}</span>}
                              {it.nuevo && <span className="chip warn" style={{ fontSize: 9 }}>NUEVO</span>}
                              {it.nuevo && <span className="chip chip-bodega-hint" style={{ fontSize: 9, background: "#FFF7ED", color: "#9A3412", border: "1px dashed #F59E0B" }}>Sin código — asignar en Bodega</span>}
                              {!it.nuevo && <span className="chip" style={{ fontSize: 9, background: "#D1FAE5", color: "#065F46" }}>EN BODEGA</span>}
                              {it.confianza !== undefined && it.confianza < 0.9 && (
                                <span className="chip" style={{ fontSize: 9, background: "#FFF1D6", color: "#8C6A1E" }}>IA {Math.round(it.confianza*100)}%</span>
                              )}
                            </div>
                            {it.nuevo && (
                              <div className="nuevo-extras">
                                <select value={it.categoria || "General"} onChange={e => actualizarItem(i, "categoria", e.target.value)} style={{ padding: "2px 4px", borderRadius: 4, border: "1px solid var(--border)", maxWidth: 110 }}>
                                  {[...new Set(MOCK.productos.map(p => p.categoria))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                                  <option value="General">General</option>
                                </select>
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>Venta:</span>
                                  <input className="mono" value={it.precio || ""} onChange={e => actualizarItem(i, "precio", parseInt(e.target.value.replace(/\D/g,"")) || 0)} placeholder="Precio" style={{ padding: "2px 4px", border: "1px solid var(--border)", borderRadius: 4, width: 70 }}/>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="num">
                            {stockActual !== null ? <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{stockActual}</span> : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                          </td>
                          <td className="num"><input className="cell-input mono" value={it.qty} onChange={e => actualizarItem(i, "qty", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/></td>
                          <td className="num"><input className="cell-input mono" value={it.costo} onChange={e => actualizarItem(i, "costo", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/></td>
                          <td><input className="cell-input mono" type="date" value={it.vence || ""} onChange={e => actualizarItem(i, "vence", e.target.value)}/></td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(it.qty * it.costo)}</td>
                          <td><button className="btn sm ghost" onClick={() => setItems(items.filter((_,j) => j !== i))}><Icon name="x" size={13}/></button></td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: tarjetas de items */}
              <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5" style={{ padding: 10 }}>
                {items.map((it, i) => {
                  const stockActual = getStock(it.sku);
                  return (
                  <div key={i} className={
                    "tw-border tw-border-border tw-rounded-lg tw-p-3 tw-relative"
                    + (it.nuevo ? " tw-bg-amber-50 tw-border-l-[3px] tw-border-l-amber-400" : " tw-bg-surface")
                  }>
                    <button className="btn sm ghost tw-absolute tw-top-2 tw-right-2" onClick={() => setItems(items.filter((_,j) => j !== i))} style={{ padding: 4 }}><Icon name="x" size={13}/></button>
                    <div className="tw-mb-1.5">
                      <input
                        value={it.nombre}
                        onChange={e => actualizarItem(i, "nombre", e.target.value)}
                        style={{ fontWeight: 600, fontSize: 14, border: "1px solid transparent", background: "transparent", color: "var(--text)", padding: "2px 0", borderRadius: 4, width: "calc(100% - 30px)" }}
                        onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; e.target.style.padding = "2px 4px"; }}
                        onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; e.target.style.padding = "2px 0"; }}
                      />
                      <div className="tw-flex tw-items-center tw-gap-1 tw-flex-wrap tw-mt-0.5">
                        {!it.nuevo && <span className="muted mono" style={{ fontSize: 11 }}>{it.sku}</span>}
                        {it.nuevo && <span className="chip warn" style={{ fontSize: 9 }}>NUEVO</span>}
                        {!it.nuevo && <span className="chip" style={{ fontSize: 9, background: "#D1FAE5", color: "#065F46" }}>EN BODEGA</span>}
                        {it.confianza !== undefined && it.confianza < 0.9 && (
                          <span className="chip" style={{ fontSize: 9, background: "#FFF1D6", color: "#8C6A1E" }}>IA {Math.round(it.confianza*100)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-mb-2">
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Cantidad</label>
                        <input className="mono" value={it.qty} onChange={e => actualizarItem(i, "qty", parseInt(e.target.value.replace(/\D/g,"")) || 0)} style={{ padding: "6px 8px", fontSize: 14 }}/>
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Costo unit.</label>
                        <input className="mono" value={it.costo} onChange={e => actualizarItem(i, "costo", parseInt(e.target.value.replace(/\D/g,"")) || 0)} style={{ padding: "6px 8px", fontSize: 14 }}/>
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Stock actual</label>
                        <div className="mono" style={{ padding: "8px", fontSize: 13, color: "var(--text-2)" }}>{stockActual !== null ? stockActual : "—"}</div>
                      </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Vence</label>
                        <input type="date" value={it.vence || ""} onChange={e => actualizarItem(i, "vence", e.target.value)} style={{ padding: "6px 8px", fontSize: 13 }}/>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>{window.fmtCOP(it.qty * it.costo)}</span>
                      </div>
                    </div>
                    {it.nuevo && (
                      <div className="tw-flex tw-gap-2 tw-mt-2 tw-pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
                        <select value={it.categoria || "General"} onChange={e => actualizarItem(i, "categoria", e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, flex: 1 }}>
                          {[...new Set(MOCK.productos.map(p => p.categoria))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="General">General</option>
                        </select>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Venta:</span>
                          <input className="mono" value={it.precio || ""} onChange={e => actualizarItem(i, "precio", parseInt(e.target.value.replace(/\D/g,"")) || 0)} placeholder="$" style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, width: 80, fontSize: 13 }}/>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)" }}>
                <span className="muted">{items.length} producto(s) · {items.reduce((s,i)=>s+i.qty,0)} unidades</span>
                <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(total)}</span>
              </div>
            </div>
          )}
        </Modal>
        );
      })()}

      {showProv && (
        <Modal title="Crear proveedor" onClose={() => setShowProv(false)} footer={
          <>
            <button className="btn ghost" onClick={() => setShowProv(false)}>Cancelar</button>
            <button className="btn primary" disabled={!provDraft.nombre || !provDraft.nit || !provDraft.tel}
              onClick={() => {
                setProveedores(ps => [...ps, { ...provDraft }]);
                setProveedor(provDraft.nombre);
                setProvDraft({ nombre: "", nit: "", tel: "" });
                setShowProv(false);
                setToast("Proveedor agregado");
              }}><Icon name="check" size={14}/> Guardar</button>
          </>
        }>
          <div className="field">
            <label>Nombre del proveedor</label>
            <input value={provDraft.nombre} onChange={e => setProvDraft(d => ({ ...d, nombre: e.target.value }))} placeholder="Ej: Distribuidora El Sol"/>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>NIT</label>
              <input className="mono" value={provDraft.nit} onChange={e => setProvDraft(d => ({ ...d, nit: e.target.value }))} placeholder="900.000.000-0"/>
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input className="mono" value={provDraft.tel} onChange={e => setProvDraft(d => ({ ...d, tel: e.target.value.replace(/[^\d\s+()-]/g,"") }))} placeholder="(4) 444 1820"/>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// =================== Escáner QR DIAN ===================
const QrScannerModal = ({ onClose, onRead }) => {
  const [estado, setEstado] = useStateA("listo"); // listo | escaneando | leyendo | exito
  const escanear = () => {
    setEstado("escaneando");
    setTimeout(() => setEstado("leyendo"), 1200);
    setTimeout(() => setEstado("exito"), 2400);
    setTimeout(() => onRead(MOCK_QR_DIAN), 3400);
  };
  return (
    <Modal title="Escanear QR de factura electrónica DIAN" onClose={onClose} lg>
      <p className="muted" style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>
        Apunta la cámara al código QR impreso en la factura electrónica. El sistema descargará los datos del XML directamente desde la DIAN.
      </p>
      <div className="scanner-frame">
        <div className="scanner-viewport">
          {estado === "listo" && (
            <div className="scanner-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h3v3M21 14v7h-7M17 17v4"/>
              </svg>
              <div style={{ marginTop: 12, fontSize: 13 }}>Cámara lista</div>
            </div>
          )}
          {estado === "escaneando" && (
            <>
              <div className="scanner-stream"/>
              <div className="scanner-line"/>
              <div className="scanner-corners"/>
              <div className="scanner-status">Buscando código QR…</div>
            </>
          )}
          {estado === "leyendo" && (
            <>
              <div className="scanner-stream"/>
              <div className="scanner-corners green"/>
              <div className="scanner-status good">Consultando DIAN…</div>
            </>
          )}
          {estado === "exito" && (
            <div className="scanner-success">
              <Icon name="check" size={40}/>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Factura encontrada</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>CUFE: {MOCK_QR_DIAN.cufe.slice(0,18)}...</div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-f" style={{ marginTop: 16, borderRadius: 8, borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
        <button className="btn ghost" onClick={onClose} disabled={estado !== "listo"}>Cancelar</button>
        <button className="btn primary" onClick={escanear} disabled={estado !== "listo"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1v6m0 6v6"/><circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          </svg>
          {estado === "listo" ? "Iniciar escaneo" : "Escaneando…"}
        </button>
      </div>
    </Modal>
  );
};

// =================== Escáner IA (foto de factura) ===================

// Fuzzy string similarity (SequenceMatcher-style ratio)
const similar = (a, b) => {
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.length === 0) return 1;
  // Find longest common subsequence length
  const m = shorter.length, n = longer.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = shorter[i-1] === longer[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  return (2 * dp[m][n]) / (m + n);
};

// Match Gemini items against inventory
const matchItems = (geminiItems) => {
  const productos = (window.MOCK && window.MOCK.productos) || [];
  return geminiItems.map(item => {
    let bestMatch = null, bestScore = 0;
    for (const p of productos) {
      const score = similar(item.nombre, p.nombre);
      if (score > bestScore) { bestScore = score; bestMatch = p; }
    }
    if (bestScore > 0.7 && bestMatch) {
      return { ...item, sku: bestMatch.sku, encontrado: true, confianza: Math.round(bestScore * 100) / 100 };
    }
    return { ...item, sku: null, encontrado: false, nuevo: true, confianza: Math.round(bestScore * 100) / 100 };
  });
};

// Catálogo de proveedores de IA
// Presets de proveedores IA (el usuario puede agregar personalizados)
const IA_PRESETS = [
  { id: "gemini",   name: "Gemini",    format: "gemini",  model: "gemini-2.0-flash",         url: "https://generativelanguage.googleapis.com/v1beta",          placeholder: "AIzaSy...",   link: "https://aistudio.google.com/apikey",         linkLabel: "Google AI Studio" },
  { id: "openai",   name: "OpenAI",    format: "openai",  model: "gpt-4o",                   url: "https://api.openai.com/v1/chat/completions",                placeholder: "sk-proj-...", link: "https://platform.openai.com/api-keys",       linkLabel: "OpenAI Platform" },
  { id: "claude",   name: "Claude",    format: "claude",  model: "claude-sonnet-4-20250514", url: "https://api.anthropic.com/v1/messages",                     placeholder: "sk-ant-...",  link: "https://console.anthropic.com/settings/keys",linkLabel: "Anthropic Console" },
  { id: "groq",     name: "Groq",      format: "openai",  model: "llama-4-scout-17b-16e-instruct", url: "https://api.groq.com/openai/v1/chat/completions",    placeholder: "gsk_...",     link: "https://console.groq.com/keys",              linkLabel: "Groq Console" },
  { id: "openrouter", name: "OpenRouter", format: "openai", model: "google/gemini-2.0-flash-exp:free", url: "https://openrouter.ai/api/v1/chat/completions",  placeholder: "sk-or-...",   link: "https://openrouter.ai/keys",                 linkLabel: "OpenRouter" },
  { id: "custom",   name: "Otro",      format: "openai",  model: "",                         url: "",                                                          placeholder: "tu-api-key",  link: "",                                           linkLabel: "" },
];

// Auto-detectar formato y modelo desde la URL
const detectFromUrl = (url) => {
  const u = (url || "").toLowerCase();
  for (const p of IA_PRESETS) {
    if (p.url && u.includes(new URL(p.url).hostname)) return { format: p.format, model: p.model, provider: p.id };
  }
  if (u.includes("googleapis.com") || u.includes("generativelanguage")) return { format: "gemini", model: "gemini-2.0-flash", provider: "gemini" };
  if (u.includes("anthropic.com")) return { format: "claude", model: "claude-sonnet-4-20250514", provider: "claude" };
  return { format: "openai", model: "gpt-4o", provider: "custom" };
};

// Load full provider config — auto-detecta formato y modelo desde la URL
const getIAConfig = () => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  const url = cfg.ia_url || "";
  const detected = detectFromUrl(url);
  return {
    format: cfg.ia_format || detected.format,
    model: cfg.ia_model || detected.model,
    url: url,
    apiKey: cfg.ia_api_key || "",
    name: detected.provider,
  };
};

const PROMPT_FACTURA = `Analiza esta factura/remisión. Extrae JSON estricto:
{ "proveedor": "...", "nit": "...", "factura": "...", "fecha": "...", "vendedor": "...", "celular": "...",
  "items": [{ "nombre": "...", "qty": 0, "costo": 0, "vence": "YYYY-MM-DD o null" }] }
Solo JSON, sin markdown ni explicaciones. Si un campo no es visible, usa null. qty y costo deben ser números.`;

// Call AI Vision API (multi-provider)
// Parse API error into friendly message
const parseApiError = (status, body, provider) => {
  try {
    const json = JSON.parse(body);
    const msg = json.error?.message || json.error?.type || "";
    if (status === 429 || msg.includes("quota") || msg.includes("rate")) {
      return `Límite de uso alcanzado en ${provider}. Espera unos segundos e intenta de nuevo, o cambia de proveedor en Ajustes.`;
    }
    if (status === 401 || status === 403 || msg.includes("auth") || msg.includes("key")) {
      return `API Key de ${provider} inválida o sin permisos. Revísala en Ajustes.`;
    }
    if (status === 400) {
      return `${provider} rechazó la solicitud. La imagen puede ser demasiado grande o el formato no es compatible.`;
    }
    if (msg) return `${provider}: ${msg.slice(0, 150)}`;
  } catch {}
  if (status === 429) return `Límite de uso alcanzado en ${provider}. Espera e intenta de nuevo.`;
  if (status === 401 || status === 403) return `API Key de ${provider} inválida. Revísala en Ajustes.`;
  if (status >= 500) return `Servidor de ${provider} no disponible. Intenta más tarde.`;
  return `Error de ${provider} (${status}). Intenta de nuevo.`;
};

const analizarConIA = async (base64, mimeType) => {
  const cfg = getIAConfig();
  if (!cfg.apiKey) throw new Error("Configura tu API Key en Ajustes antes de usar el escáner IA.");
  const label = cfg.name || cfg.id;
  let text;

  // Timeout de 60s para evitar que se quede colgado en 90%
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 60000);

  try {
  if (cfg.format === "claude") {
    const res = await fetch(cfg.url || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 2048,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: PROMPT_FACTURA }
        ]}],
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.content?.[0]?.text;

  } else if (cfg.format === "gemini") {
    // Construir URL de Gemini: normalizar lo que el usuario ponga
    const buildGeminiUrl = () => {
      const model = cfg.model || "gemini-2.0-flash";
      if (!cfg.url) return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
      let u = cfg.url.split("?")[0].replace(/\/+$/, ""); // quitar query params y trailing slashes
      if (!u.includes("/models/")) u += `/models/${model}:generateContent`;
      else if (!u.includes(":generateContent")) u += ":generateContent";
      return u + `?key=${cfg.apiKey}`;
    };
    const url = buildGeminiUrl();
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: PROMPT_FACTURA }
      ]}]}),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.candidates?.[0]?.content?.parts?.[0]?.text;

  } else {
    // OpenAI-compatible format (OpenAI, Groq, OpenRouter, Together, Mistral, custom, etc.)
    const endpoint = cfg.url || "https://api.openai.com/v1/chat/completions";
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: PROMPT_FACTURA }
        ]}],
        max_tokens: 2048,
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(parseApiError(res.status, err, label)); }
    const json = await res.json();
    text = json.choices?.[0]?.message?.content;
  }
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`${label} tardó demasiado (>60s). Intenta con una imagen más pequeña o cambia de proveedor IA en Ajustes.`);
    throw e;
  } finally { clearTimeout(tid); }

  if (!text) throw new Error("La IA no devolvió resultado. Intenta con una imagen más clara.");
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(clean); }
  catch { throw new Error("La IA devolvió un formato inválido. Intenta con una foto más clara de la factura."); }
};

const IaScannerModal = ({ onClose, onRead }) => {
  const [estado, setEstado] = useStateA("listo"); // listo | preview | analizando | exito | error
  const [progreso, setProgreso] = useStateA(0);
  const [imgSrc, setImgSrc] = useStateA(null);
  const [fileName, setFileName] = useStateA("");
  const [isPdf, setIsPdf] = useStateA(false);
  const [imgData, setImgData] = useStateA(null); // { base64, mimeType }
  const [resultado, setResultado] = useStateA(null);
  const [errorMsg, setErrorMsg] = useStateA("");
  const fileRef = React.useRef(null);

  const seleccionarImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pdf = file.type === "application/pdf";
    setIsPdf(pdf);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result);
      const b64 = reader.result.split(",")[1];
      setImgData({ base64: b64, mimeType: file.type || "image/jpeg" });
      setEstado("preview");
    };
    reader.readAsDataURL(file);
  };

  const analizar = async () => {
    if (!imgData) return;
    setEstado("analizando");
    setProgreso(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 3 + Math.random() * 5;
      if (p > 90) p = 90;
      setProgreso(Math.round(p));
    }, 300);
    try {
      const raw = await analizarConIA(imgData.base64, imgData.mimeType);
      clearInterval(interval);
      setProgreso(100);
      const items = matchItems(raw.items || []);
      const data = { ...raw, items };
      setResultado(data);
      setEstado("exito");
      setTimeout(() => onRead(data), 1200);
    } catch (err) {
      clearInterval(interval);
      const msg = err.name === "TypeError" && err.message.includes("fetch")
        ? "Sin conexión a internet. Verifica tu red e intenta de nuevo."
        : err.message || "Error al analizar la imagen.";
      setErrorMsg(msg);
      setEstado("error");
    }
  };

  const reintentar = () => {
    setEstado(imgSrc ? "preview" : "listo");
    setErrorMsg("");
    setProgreso(0);
  };

  return (
    <Modal title="Fotografiar factura" onClose={onClose} lg>
      <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>
        Sube o toma una foto clara de la factura del proveedor. La IA leerá automáticamente proveedor, productos, cantidades y costos.
      </p>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" style={{ display: "none" }} onChange={seleccionarImagen}/>
      <div className="scanner-frame">
        <div className="scanner-viewport" style={{ background: "#1a1f2e" }}>
          {estado === "listo" && (
            <div className="scanner-placeholder" style={{ color: "#fff", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ marginTop: 12, fontSize: 13 }}>Toca para seleccionar archivo</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Foto, imagen PNG/JPG o PDF · cámara en móvil</div>
            </div>
          )}
          {estado === "preview" && imgSrc && (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isPdf ? (
                <div style={{ textAlign: "center", color: "#fff" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>{fileName}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>PDF listo para analizar</div>
                </div>
              ) : (
                <img src={imgSrc} alt="Factura" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}/>
              )}
            </div>
          )}
          {estado === "analizando" && (
            <>
              {imgSrc && !isPdf && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.25 }}>
                  <img src={imgSrc} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}/>
                </div>
              )}
              <div className="ai-overlay">
                <div className="ai-status">
                  <div className="ai-spinner"/>
                  Analizando con IA… {progreso}%
                </div>
                <div className="ai-progress"><span style={{ width: progreso + "%" }}/></div>
                <div className="ai-checks">
                  {progreso > 15 && <div>✓ Imagen enviada a Gemini</div>}
                  {progreso > 40 && <div>✓ Extrayendo datos de factura</div>}
                  {progreso > 70 && <div>✓ Identificando productos</div>}
                  {progreso >= 100 && <div>✓ Cruzando con inventario</div>}
                </div>
              </div>
            </>
          )}
          {estado === "exito" && resultado && (
            <div className="scanner-success">
              <Icon name="check" size={40}/>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Análisis completado</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {resultado.items.length} productos detectados · {resultado.items.filter(i => i.encontrado).length} encontrados en inventario
              </div>
            </div>
          )}
          {estado === "error" && (
            <div className="scanner-placeholder" style={{ color: "#fff" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <div style={{ marginTop: 10, fontSize: 13, color: "#EF4444" }}>Error al analizar</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4, maxWidth: 280, textAlign: "center", lineHeight: 1.4 }}>{errorMsg}</div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-f" style={{ marginTop: 16, borderRadius: 8, borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
        <button className="btn ghost" onClick={estado === "error" ? reintentar : onClose} disabled={estado === "analizando"}>
          {estado === "error" ? "Reintentar" : "Cancelar"}
        </button>
        {estado === "listo" && (
          <button className="btn primary" onClick={() => fileRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Seleccionar imagen
          </button>
        )}
        {estado === "preview" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={() => { setImgSrc(null); setImgData(null); setIsPdf(false); setFileName(""); setEstado("listo"); }}>Cambiar</button>
            <button className="btn primary" onClick={analizar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
              Analizar con IA
            </button>
          </div>
        )}
        {estado === "error" && (
          <button className="btn primary" onClick={() => { setEstado("listo"); setImgSrc(null); setImgData(null); setIsPdf(false); setFileName(""); setErrorMsg(""); }}>
            Nueva imagen
          </button>
        )}
      </div>
    </Modal>
  );
};

const ItemAdder = ({ onAdd }) => {
  const [sku, setSku] = useStateA("");
  const [query, setQuery] = useStateA("");
  const [codigo, setCodigo] = useStateA("");
  const [qty, setQty] = useStateA("");
  const [costo, setCosto] = useStateA("");
  const [vence, setVence] = useStateA("");
  const [open, setOpen] = useStateA(false);
  const opts = MOCK.productos;
  const sugeridos = useMemoA(() => {
    if (!query) return opts.slice(0, 8);
    const q = query.toLowerCase().trim();
    return opts.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const elegir = (p) => {
    setSku(p.sku);
    setQuery(`${p.nombre} (${p.sku})`);
    setCodigo(p.sku);
    setCosto(p.costo);
    setOpen(false);
  };

  return (
    <div className="card mt-2" style={{ background: "var(--surface-2)", padding: 14 }}>
      <div className="item-adder-grid tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-[1.6fr_1fr_0.8fr_0.9fr_0.9fr_auto] tw-gap-2 md:tw-gap-2 tw-items-end">
        <div className="field" style={{ margin: 0, position: "relative" }}>
          <label>Producto</label>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSku(""); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={e => {
              if (e.key === "Enter" && sugeridos.length === 1) elegir(sugeridos[0]);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Nombre, SKU o código de barras…"
          />
          {open && sugeridos.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,.08)", zIndex: 20, maxHeight: 240, overflowY: "auto"
            }}>
              {sugeridos.map(p => (
                <div key={p.sku} onMouseDown={() => elegir(p)}
                  style={{ padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{p.sku} · {p.categoria}</div>
                  </div>
                  <span className="mono muted" style={{ fontSize: 11 }}>Stock {p.stock}</span>
                </div>
              ))}
            </div>
          )}
          {open && query && sugeridos.length === 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text-3)" }}>
              Sin coincidencias
            </div>
          )}
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Código de barras / SKU</label>
          <input className="mono" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g,""))} placeholder="7702001"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Cantidad</label>
          <input className="mono" value={qty} onChange={e => setQty(e.target.value)} placeholder="0"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Costo unit.</label>
          <input className="mono" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Vence</label>
          <input type="date" value={vence} onChange={e => setVence(e.target.value)}/>
        </div>
        <button className="btn primary" disabled={!sku || !qty || !codigo} onClick={() => {
          onAdd(codigo, qty, costo, vence);
          setSku(""); setQuery(""); setCodigo(""); setQty(""); setCosto(""); setVence("");
        }}><Icon name="plus" size={14}/> Agregar</button>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="search" size={11}/>
        Busca por nombre, SKU o código de barras. El código quedará asociado al producto y será reconocido por el lector de barras en el punto de venta.
      </div>
    </div>
  );
};

// =================== Vencimientos ===================
const Vencimientos = () => {
  const [tab, setTab] = useStateA("preventivo");
  const [destinatarios, setDestinatarios] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("invenpro-alert-emails")) || [
      { email: "admin@invenpro.co", nombre: "Administrador" },
      { email: "bodega@invenpro.co", nombre: "Bodega" },
    ]; } catch { return []; }
  });
  const [umbrales, setUmbrales] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("invenpro-umbrales")) || { critico: 8, atencion: 15, preventivo: 30 }; }
    catch { return { critico: 8, atencion: 15, preventivo: 30 }; }
  });
  const [nuevoEmail, setNuevoEmail] = useStateA("");
  const [nuevoNombre, setNuevoNombre] = useStateA("");
  const [showPreview, setShowPreview] = useStateA(null);
  const [showConfig, setShowConfig] = useStateA(false);
  const [logs, setLogs] = useStateA([]);
  const [toast, setToast] = useStateA(null);

  React.useEffect(() => {
    try { localStorage.setItem("invenpro-alert-emails", JSON.stringify(destinatarios)); } catch {}
  }, [destinatarios]);
  React.useEffect(() => {
    try { localStorage.setItem("invenpro-umbrales", JSON.stringify(umbrales)); } catch {}
  }, [umbrales]);

  const all = MOCK.productos.filter(p => p.vence);
  const buckets = {
    vencido: all.filter(p => window.daysFromNow(p.vence) < 0),
    critico: all.filter(p => { const d = window.daysFromNow(p.vence); return d >= 0 && d <= umbrales.critico; }),
    atencion: all.filter(p => { const d = window.daysFromNow(p.vence); return d > umbrales.critico && d <= umbrales.atencion; }),
    preventivo: all.filter(p => { const d = window.daysFromNow(p.vence); return d > umbrales.atencion && d <= umbrales.preventivo; }),
    ok: all.filter(p => window.daysFromNow(p.vence) > umbrales.preventivo),
  };
  const visible = (buckets[tab] || []).slice().sort((a,b) => window.daysFromNow(a.vence) - window.daysFromNow(b.vence));
  const pagVis = usePagination(visible, 10);
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const agregarDest = () => {
    if (!validEmail(nuevoEmail)) { setToast("Correo inválido"); return; }
    if (destinatarios.find(d => d.email === nuevoEmail.toLowerCase())) { setToast("Ya está en la lista"); return; }
    setDestinatarios(ds => [...ds, { email: nuevoEmail.toLowerCase(), nombre: nuevoNombre || nuevoEmail.split("@")[0] }]);
    setNuevoEmail(""); setNuevoNombre("");
    setToast("Destinatario agregado");
  };

  const eliminarDest = (em) => setDestinatarios(ds => ds.filter(d => d.email !== em));

  const tierConfig = {
    preventivo: { lbl: `${umbrales.preventivo} días`, c: "accent", icon: "calendar", desc: "Aviso preventivo" },
    atencion:   { lbl: `${umbrales.atencion} días`,   c: "warn",   icon: "clock",    desc: "Atención requerida" },
    critico:    { lbl: `${umbrales.critico} días`,    c: "bad",    icon: "alert",    desc: "Acción urgente" },
  };

  const enviarAlerta = (tier) => {
    const items = buckets[tier];
    if (destinatarios.length === 0) { setToast("Agrega al menos un destinatario"); return; }
    if (items.length === 0) { setToast("No hay productos en este umbral"); return; }
    const log = {
      id: "ALR-" + Date.now().toString(36).toUpperCase(),
      tier, lbl: tierConfig[tier].lbl,
      enviadoA: destinatarios.map(d => d.email),
      productos: items.length,
      fecha: new Date().toLocaleString("es-CO"),
    };
    setLogs(ls => [log, ...ls].slice(0, 20));
    setToast(`Alerta de ${tierConfig[tier].lbl} enviada a ${destinatarios.length} destinatario(s)`);
  };

  const enviarTodas = () => {
    const tiers = ["preventivo", "atencion", "critico"].filter(t => buckets[t].length > 0);
    if (destinatarios.length === 0) { setToast("Agrega al menos un destinatario"); return; }
    if (tiers.length === 0) { setToast("No hay productos en ningún umbral"); return; }
    tiers.forEach(t => enviarAlerta(t));
  };

  const ajustarUmbral = (k, v) => {
    const n = Math.max(1, Math.min(365, parseInt(v) || 0));
    setUmbrales(u => {
      const next = { ...u, [k]: n };
      // Mantener orden: critico < atencion < preventivo
      if (next.critico >= next.atencion) next.atencion = next.critico + 1;
      if (next.atencion >= next.preventivo) next.preventivo = next.atencion + 1;
      return next;
    });
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Control de vencimientos</h2>
          <p className="sub">Productos próximos a vencer agrupados por urgencia.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setShowConfig(true)}><Icon name="settings" size={14}/> Configurar alertas</button>
          <button className="btn primary" onClick={enviarTodas}><Icon name="bell" size={14}/> Enviar alertas</button>
        </div>
      </div>

      <div className="grid-2 mb-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { id: "critico",    lbl: `Crítico · ≤ ${umbrales.critico} días`,                          n: buckets.critico.length,    c: "bad" },
          { id: "atencion",   lbl: `Atención · ${umbrales.critico+1}-${umbrales.atencion} días`,    n: buckets.atencion.length,   c: "warn" },
          { id: "preventivo", lbl: `Preventivo · ${umbrales.atencion+1}-${umbrales.preventivo} días`, n: buckets.preventivo.length, c: "accent" },
          { id: "ok",         lbl: `Sin riesgo · más de ${umbrales.preventivo}d`,                   n: buckets.ok.length,         c: "good" },
        ].map(b => (
          <button key={b.id} className="kpi" style={{ textAlign: "left", borderColor: tab === b.id ? "var(--accent)" : undefined, cursor: "pointer" }} onClick={() => setTab(b.id)}>
            <div className="label"><span className={"chip " + b.c}><span className="dot"/></span>{b.lbl}</div>
            <div className="val">{b.n}</div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-h">
          <h3>{visible.length} producto(s)</h3>
          <div className="muted" style={{ fontSize: 12 }}>Ordenados por fecha de vencimiento</div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Producto</th><th className="num">Stock</th><th>Vence</th><th>Días</th></tr></thead>
            <tbody>
              {pagVis.slice.map(p => {
                const d = window.daysFromNow(p.vence);
                const cls = d < 0 ? "bad" : d <= umbrales.critico ? "bad" : d <= umbrales.atencion ? "warn" : d <= umbrales.preventivo ? "accent" : "good";
                return (
                  <tr key={p.sku} className="row-hover">
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div className="muted mono" style={{ fontSize: 11 }}>{p.sku} · {p.categoria}</div>
                    </td>
                    <td className="num mono">{p.stock} {p.unidad}</td>
                    <td className="mono">{p.vence}</td>
                    <td><span className={"chip " + cls}>{d < 0 ? `Hace ${-d}d` : d === 0 ? "Hoy" : `${d} días`}</span></td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr><td colSpan="4"><div className="empty-state"><div className="icon"><Icon name="check" size={22}/></div>Sin productos en este grupo.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination {...pagVis} label="productos"/>
      </div>

      {showConfig && (
        <Modal title="Configurar alertas de vencimiento" lg onClose={() => setShowConfig(false)}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Umbrales de notificación</h4>
          <p className="muted" style={{ margin: "0 0 12px", fontSize: 12 }}>
            Días antes del vencimiento en que el sistema enviará una alerta. Los umbrales se ordenan automáticamente del más urgente al más preventivo.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
            <div style={{ border: "1px solid var(--bad-soft)", background: "color-mix(in oklab, var(--bad-soft) 50%, transparent)", borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4, color: "var(--bad)" }}>🔴 Crítico</div>
              <div className="row" style={{ gap: 6, alignItems: "center" }}>
                <input className="mono" type="number" min="1" max="30" value={umbrales.critico} onChange={e => ajustarUmbral("critico", e.target.value)} style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}/>
                <span className="muted" style={{ fontSize: 12 }}>días</span>
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>Acción urgente</div>
            </div>
            <div style={{ border: "1px solid var(--warn-soft)", background: "color-mix(in oklab, var(--warn-soft) 50%, transparent)", borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4, color: "var(--warn)" }}>🟡 Atención</div>
              <div className="row" style={{ gap: 6, alignItems: "center" }}>
                <input className="mono" type="number" min="2" max="60" value={umbrales.atencion} onChange={e => ajustarUmbral("atencion", e.target.value)} style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}/>
                <span className="muted" style={{ fontSize: 12 }}>días</span>
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>Atención requerida</div>
            </div>
            <div style={{ border: "1px solid var(--accent-soft)", background: "color-mix(in oklab, var(--accent-soft) 50%, transparent)", borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4, color: "var(--accent)" }}>🔵 Preventivo</div>
              <div className="row" style={{ gap: 6, alignItems: "center" }}>
                <input className="mono" type="number" min="3" max="180" value={umbrales.preventivo} onChange={e => ajustarUmbral("preventivo", e.target.value)} style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}/>
                <span className="muted" style={{ fontSize: 12 }}>días</span>
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>Aviso anticipado</div>
            </div>
          </div>

          <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Destinatarios de las alertas</h4>
          <p className="muted" style={{ margin: "0 0 12px", fontSize: 12 }}>
            Estos correos recibirán las notificaciones automáticas a {umbrales.preventivo}, {umbrales.atencion} y {umbrales.critico} días.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Correo</label>
              <input value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="nombre@empresa.co" onKeyDown={e => { if (e.key === "Enter") agregarDest(); }}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Nombre <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span></label>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Bodega" onKeyDown={e => { if (e.key === "Enter") agregarDest(); }}/>
            </div>
            <button className="btn primary" onClick={agregarDest}><Icon name="plus" size={14}/> Agregar</button>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, maxHeight: 240, overflowY: "auto" }}>
            {destinatarios.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>Sin destinatarios aún.</div>
            ) : destinatarios.map(d => (
              <div key={d.email} className="row" style={{ justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{d.nombre}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{d.email}</div>
                </div>
                <button className="btn sm ghost" onClick={() => eliminarDest(d.email)}><Icon name="trash" size={13}/></button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// =================== Proveedores ===================
const Proveedores = () => {
  const [list, setList] = useStateA(MOCK.proveedores);
  const [q, setQ] = useStateA("");
  const [estado, setEstado] = useStateA("Todos");
  const [categoria, setCategoria] = useStateA("Todas");
  const [editing, setEditing] = useStateA(null); // null | "new" | proveedor
  const [confirmBaja, setConfirmBaja] = useStateA(null);
  const [toast, setToast] = useStateA(null);

  const categorias = useMemoA(() => ["Todas", ...Array.from(new Set(list.map(p => p.categoria)))], [list]);

  const filtered = useMemoA(() => list.filter(p => {
    if (estado !== "Todos" && p.estado !== estado) return false;
    if (categoria !== "Todas" && p.categoria !== categoria) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!p.nombre.toLowerCase().includes(s) &&
          !p.nit.toLowerCase().includes(s) &&
          !(p.contacto || "").toLowerCase().includes(s) &&
          !(p.email || "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [list, q, estado, categoria]);

  const activos = list.filter(p => p.estado === "activo").length;
  const inactivos = list.length - activos;
  const pagProv = usePagination(filtered, 10);
  const guardar = async (data) => {
    if (data.id) {
      await DB.updateProveedor(data.id, data);
      setToast("Proveedor actualizado");
    } else {
      const nextId = "PRV-" + String(list.length + 1).padStart(3, "0");
      const nuevo = { ...data, id: nextId, ingresos: 0, ultimoIngreso: null, estado: "activo" };
      await DB.createProveedor(nuevo);
      setToast("Proveedor creado");
    }
    await hydrateData();
    setList(MOCK.proveedores);
    setEditing(null);
  };

  const toggleEstado = async (p) => {
    const nuevoEstado = p.estado === "activo" ? "inactivo" : "activo";
    await DB.updateProveedor(p.id, { estado: nuevoEstado });
    setToast(p.estado === "activo" ? "Proveedor dado de baja" : "Proveedor reactivado");
    await hydrateData();
    setList(MOCK.proveedores);
    setConfirmBaja(null);
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Proveedores</h2>
          <p className="sub">Crea, edita o da de baja a las empresas que abastecen tu inventario.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setEditing("new")}><Icon name="plus" size={14}/> Nuevo proveedor</button>
        </div>
      </div>

      <div className="kpi-grid mt-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi">
          <div className="label"><Icon name="users" size={14}/> Total proveedores</div>
          <div className="val">{list.length}</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="check" size={14}/> Activos</div>
          <div className="val" style={{ color: "var(--good)" }}>{activos}</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="x" size={14}/> Dados de baja</div>
          <div className="val" style={{ color: "var(--text-3)" }}>{inactivos}</div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="row prov-toolbar" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div className="prov-filters" style={{ display: "flex", gap: 8, flex: 1, minWidth: 240, flexWrap: "wrap" }}>
            <div className="search" style={{ flex: 1, minWidth: 200 }}>
              <Icon name="search" size={14}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, NIT, contacto…"/>
            </div>
            <div className="select-pill"><span className="lbl">Estado</span>
              <select value={estado} onChange={e => setEstado(e.target.value)}>
                <option>Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
              </select>
            </div>
            <div className="select-pill"><span className="lbl">Categoría</span>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="muted mono prov-count" style={{ fontSize: 12 }}>{filtered.length} de {list.length}</div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl prov-table">
            <thead>
              <tr>
                <th>Proveedor</th><th>NIT</th><th>Categoría</th><th>Contacto</th>
                <th>Términos</th><th>Estado</th><th className="num">Ingresos</th><th>Último</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pagProv.slice.map(p => (
                <tr key={p.id} className="row-hover">
                  <td>
                    <div className="row">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 12 }}>
                        {p.nombre.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                        <div className="muted mono" style={{ fontSize: 11 }}>{p.id} · {p.ciudad}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{p.nit}</td>
                  <td><span className="chip">{p.categoria}</span></td>
                  <td>
                    <div style={{ fontSize: 13 }}>{p.contacto}</div>
                    <div className="muted mono" style={{ fontSize: 11 }}>{p.tel}</div>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.terminos}</td>
                  <td>
                    <span className={"chip " + (p.estado === "activo" ? "good" : "bad")}>
                      <span className="dot"/>{p.estado}
                    </span>
                  </td>
                  <td className="num mono">{p.ingresos}</td>
                  <td className="mono muted" style={{ fontSize: 12 }}>{p.ultimoIngreso || "—"}</td>
                  <td className="num">
                    <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                      <button className="btn sm ghost" title="Editar" onClick={() => setEditing(p)}>
                        <Icon name="edit" size={13}/>
                      </button>
                      <button className="btn sm ghost" title={p.estado === "activo" ? "Dar de baja" : "Reactivar"}
                        onClick={() => setConfirmBaja(p)}>
                        <Icon name={p.estado === "activo" ? "trash" : "check"} size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9" className="muted" style={{ textAlign: "center", padding: 32 }}>Sin resultados con los filtros aplicados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination {...pagProv} label="proveedores"/>
      </div>

      {editing && (
        <ProveedorForm
          inicial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={guardar}
        />
      )}

      {confirmBaja && (
        <Modal title={confirmBaja.estado === "activo" ? "Dar de baja proveedor" : "Reactivar proveedor"}
          onClose={() => setConfirmBaja(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirmBaja(null)}>Cancelar</button>
              <button className={"btn " + (confirmBaja.estado === "activo" ? "danger" : "primary")}
                onClick={() => toggleEstado(confirmBaja)}>
                <Icon name={confirmBaja.estado === "activo" ? "trash" : "check"} size={14}/>
                {confirmBaja.estado === "activo" ? " Dar de baja" : " Reactivar"}
              </button>
            </>
          }>
          {confirmBaja.estado === "activo" ? (
            <p>El proveedor <strong>{confirmBaja.nombre}</strong> dejará de aparecer al registrar nuevos ingresos. Su historial ({confirmBaja.ingresos} ingresos) se conservará. Puedes reactivarlo en cualquier momento.</p>
          ) : (
            <p>Vas a reactivar a <strong>{confirmBaja.nombre}</strong>. Volverá a estar disponible para registrar ingresos.</p>
          )}
        </Modal>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

const ProveedorForm = ({ inicial, onClose, onSave }) => {
  const [d, setD] = useStateA(inicial || {
    nombre: "", nit: "", contacto: "", tel: "", email: "",
    ciudad: "", categoria: "Abarrotes", terminos: "30 días"
  });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const valid = d.nombre && d.nit && d.contacto && d.tel;

  return (
    <Modal title={inicial ? "Editar proveedor" : "Nuevo proveedor"} onClose={onClose} lg footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(d)}>
          <Icon name="check" size={14}/> {inicial ? "Guardar cambios" : "Crear proveedor"}
        </button>
      </>
    }>
      <div className="grid-2">
        <div className="field"><label>Razón social *</label>
          <input value={d.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Distribuidora El Sol"/></div>
        <div className="field"><label>NIT *</label>
          <input className="mono" value={d.nit} onChange={e => set("nit", e.target.value)} placeholder="900.000.000-0"/></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>Categoría</label>
          <select value={d.categoria} onChange={e => set("categoria", e.target.value)}>
            <option>Abarrotes</option><option>Lácteos</option><option>Frutas y verduras</option>
            <option>Aseo</option><option>Bebidas</option><option>Panadería</option><option>Otros</option>
          </select></div>
        <div className="field"><label>Términos de pago</label>
          <select value={d.terminos} onChange={e => set("terminos", e.target.value)}>
            <option>Contado</option><option>15 días</option><option>30 días</option><option>45 días</option><option>60 días</option>
          </select></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>Persona de contacto *</label>
          <input value={d.contacto} onChange={e => set("contacto", e.target.value)} placeholder="Ej: Mauricio Rendón"/></div>
        <div className="field"><label>Teléfono *</label>
          <input className="mono" value={d.tel} onChange={e => set("tel", e.target.value)} placeholder="(4) 444 0000"/></div>
      </div>
      <div className="grid-2">
        <div className="field"><label>Correo</label>
          <input value={d.email} onChange={e => set("email", e.target.value)} placeholder="ventas@empresa.co"/></div>
        <div className="field"><label>Ciudad</label>
          <input value={d.ciudad} onChange={e => set("ciudad", e.target.value)} placeholder="Medellín"/></div>
      </div>
    </Modal>
  );
};

// =================== Cajeros y turnos ===================
const Cajeros = () => {
  const [tab, setTab] = useStateA("equipo");
  const [showAdd, setShowAdd] = useStateA(false);
  const [toast, setToast] = useStateA(null);
  const pagCaj = usePagination(MOCK.cajeros, 2);
  const pagTur = usePagination(MOCK.turnos, 10);

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Cajeros y turnos</h2>
          <p className="sub">Administra usuarios del POS y supervisa la actividad de cada turno.</p>
        </div>
        <div className="row">
          <div className="tab-bar">
            <button className={tab === "equipo" ? "on" : ""} onClick={() => setTab("equipo")}>Equipo</button>
            <button className={tab === "turnos" ? "on" : ""} onClick={() => setTab("turnos")}>Turnos</button>
          </div>
          <button className="btn primary" onClick={() => setShowAdd(true)}><Icon name="plus" size={14}/> Nuevo cajero</button>
        </div>
      </div>

      {tab === "equipo" && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cajero</th><th>Documento</th><th>Rol</th><th>Estado</th><th>Turno actual</th><th>Ingreso</th><th className="num">Ventas (30d)</th><th></th></tr></thead>
              <tbody>
                {pagCaj.slice.map(c => (
                  <tr key={c.id} className="row-hover">
                    <td>
                      <div className="row">
                        <div style={{ width: 30, height: 30, borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 12 }}>
                          {c.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{c.doc}</td>
                    <td><span className="chip">{c.rol}</span></td>
                    <td><span className={"chip " + (c.estado === "activo" ? "good" : "bad")}><span className="dot"/>{c.estado}</span></td>
                    <td>{c.turnoActivo ? <span className="chip accent"><span className="dot"/>En turno</span> : <span className="muted">—</span>}</td>
                    <td className="muted">{c.ingreso}</td>
                    <td className="num mono">{window.fmtCOP(c.ventas30d)}</td>
                    <td className="num">
                      <button className="btn sm ghost"><Icon name="settings" size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pagCaj} label="cajeros"/>
        </div>
      )}

      {tab === "turnos" && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>N° turno</th><th>Cajero</th><th>Apertura</th><th>Cierre</th><th>Estado</th><th className="num">Base</th><th className="num">Ventas</th><th className="num">Trans.</th></tr></thead>
              <tbody>
                {pagTur.slice.map(t => (
                  <tr key={t.id} className="row-hover">
                    <td className="mono">{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.cajero}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{t.fechaIni}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{t.fechaFin || <span className="muted">—</span>}</td>
                    <td><span className={"chip " + (t.estado === "abierto" ? "good" : "")}>{t.estado === "abierto" ? <><span className="dot"/>abierto</> : "cerrado"}</span></td>
                    <td className="num mono">{window.fmtCOP(t.baseIni)}</td>
                    <td className="num mono">{window.fmtCOP(t.ventas)}</td>
                    <td className="num mono">{t.transacciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pagTur} label="turnos"/>
        </div>
      )}

      {showAdd && (
        <Modal title="Nuevo cajero" onClose={() => setShowAdd(false)} footer={
          <>
            <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn primary" onClick={() => { setShowAdd(false); setToast("Cajero creado correctamente"); }}><Icon name="check"/> Crear cajero</button>
          </>
        }>
          <div className="grid-2">
            <div className="field"><label>Nombres</label><input placeholder="Ej: Carolina"/></div>
            <div className="field"><label>Apellidos</label><input placeholder="Ej: Mendoza"/></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Documento</label><input className="mono" placeholder="C.C."/></div>
            <div className="field"><label>Teléfono</label><input className="mono" placeholder="+57"/></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Rol</label><select><option>Cajero</option><option>Supervisor</option></select></div>
            <div className="field"><label>Usuario POS</label><input className="mono" placeholder="nombre.apellido"/></div>
          </div>
        </Modal>
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// =================== Reporte de ventas ===================
const Reportes = () => {
  const [filtroMes, setFiltroMes] = useStateA("Todos");
  const [filtroCajero, setFiltroCajero] = useStateA("Todos");
  const [filtroProducto, setFiltroProducto] = useStateA("Todos");
  const [filtroMetodo, setFiltroMetodo] = useStateA("Todos");

  const meses = useMemoA(() => {
    const s = new Set(MOCK.facturas.map(f => f.fecha.slice(0,7)));
    return ["Todos", ...Array.from(s).sort().reverse()];
  }, []);
  const cajeros = ["Todos", ...new Set(MOCK.facturas.map(f => f.cajero))];
  const metodos = ["Todos", "Efectivo", "Transferencia", "Nequi", "Daviplata"];
  const productosOpts = ["Todos", ...MOCK.productos.map(p => p.nombre)];
  const filtered = useMemoA(() => MOCK.facturas.filter(f => {
    if (filtroMes !== "Todos" && !f.fecha.startsWith(filtroMes)) return false;
    if (filtroCajero !== "Todos" && f.cajero !== filtroCajero) return false;
    if (filtroMetodo !== "Todos" && f.metodo !== filtroMetodo) return false;
    if (filtroProducto !== "Todos" && !f.items.some(i => i.nombre === filtroProducto)) return false;
    return true;
  }), [filtroMes, filtroCajero, filtroProducto, filtroMetodo]);
  const pagRep = usePagination(filtered, 10);

  const totalFiltro = filtered.reduce((s,f) => s + f.total, 0);
  const tickets = filtered.length;
  const promedio = tickets ? totalFiltro/tickets : 0;

  // Para el chart por mes
  const byMonth = useMemoA(() => {
    const map = {};
    filtered.forEach(f => {
      const k = f.fecha.slice(0,7);
      map[k] = (map[k] || 0) + f.total;
    });
    return Object.entries(map).sort().map(([m,v]) => ({ mes: m, total: v }));
  }, [filtered]);

  // Por cajero
  const byCajero = useMemoA(() => {
    const map = {};
    filtered.forEach(f => { map[f.cajero] = (map[f.cajero] || 0) + f.total; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([n,v]) => ({ nombre: n, total: v }));
  }, [filtered]);

  // Por método de pago
  const byMetodo = useMemoA(() => {
    const map = {};
    filtered.forEach(f => { map[f.metodo] = (map[f.metodo] || 0) + f.total; });
    const sum = Object.values(map).reduce((a,b)=>a+b, 0) || 1;
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([n,v]) => ({ nombre: n, total: v, pct: (v/sum)*100 }));
  }, [filtered]);

  // Top productos del filtro
  const topProductosFiltro = useMemoA(() => {
    const map = {};
    filtered.forEach(f => {
      f.items.forEach(it => {
        if (!map[it.nombre]) map[it.nombre] = { nombre: it.nombre, qty: 0, total: 0 };
        map[it.nombre].qty += it.q;
        map[it.nombre].total += it.q * it.precio;
      });
    });
    return Object.values(map).sort((a,b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  const metodoColors = { Efectivo: "#22C55E", Transferencia: "#3B82F6", Nequi: "#8B5CF6", Daviplata: "#EF4444" };

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Reporte de ventas</h2>
          <p className="sub">Análisis filtrable por mes, cajero, producto o método de pago.</p>
        </div>
        <button className="btn" onClick={() => exportXlsx("InvenPro_reporte_ventas.xlsx", [
          { name: "Facturas", rows: filtered.map(f => ({
            Factura: f.id, Fecha: f.fecha, Hora: f.hora, Cajero: f.cajero,
            Items: f.items.reduce((a,i)=>a+i.q, 0), Método: f.metodo, Total: f.total
          })) },
          { name: "Por mes", rows: byMonth.map(x => ({ Mes: x.mes, Total: x.total })) },
          { name: "Por cajero", rows: byCajero.map(x => ({ Cajero: x.nombre, Total: x.total })) },
        ])}><Icon name="download" size={14}/> Exportar reporte</button>
      </div>

      <div className="filterbar">
        <div className="select-pill"><span className="lbl">Mes</span>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            {meses.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="select-pill"><span className="lbl">Cajero</span>
          <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)}>
            {cajeros.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="select-pill"><span className="lbl">Producto</span>
          <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}>
            {productosOpts.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="select-pill"><span className="lbl">Método</span>
          <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
            {metodos.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn sm" onClick={() => { setFiltroMes("Todos"); setFiltroCajero("Todos"); setFiltroProducto("Todos"); setFiltroMetodo("Todos"); }}>Limpiar</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi"><div className="label">Total filtrado</div><div className="val">{window.fmtCOP(totalFiltro)}</div><div className="muted" style={{ fontSize: 12 }}>{tickets} facturas</div></div>
        <div className="kpi"><div className="label">Ticket promedio</div><div className="val">{window.fmtCOP(promedio)}</div></div>
        <div className="kpi"><div className="label">Productos vendidos</div><div className="val">{filtered.reduce((s,f) => s + f.items.reduce((a,i)=>a+i.q, 0), 0)}</div></div>
      </div>

      <div className="grid-2 mt-3" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <div className="card">
          <div className="card-h"><h3>Ventas por mes</h3><p className="sub">{byMonth.length} mes(es)</p></div>
          <div className="card-b">
            {byMonth.length > 0 ? (
              <div className="chart-bars">
                {byMonth.map((b, i) => {
                  const max = Math.max(...byMonth.map(x => x.total));
                  return (
                    <div key={b.mes} className="col">
                      <div className="bar-wrap">
                        <div className="val mono">{(b.total/1000000).toFixed(1)}M</div>
                        <div className="bar" style={{ height: `${(b.total/max)*100}%` }}/>
                      </div>
                      <div className="lbl">{b.mes}</div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="empty-state">Sin ventas con estos filtros.</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Por cajero</h3></div>
          <div>
            {byCajero.length > 0 ? byCajero.map(c => {
              const max = byCajero[0].total;
              return (
                <div key={c.nombre} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div className="row spaced" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.nombre}</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{window.fmtCOP(c.total)}</span>
                  </div>
                  <div className="progress"><span style={{ width: `${(c.total/max)*100}%` }}/></div>
                </div>
              );
            }) : <div className="empty-state">Sin datos.</div>}
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-h" id="detalle-facturas"><h3>Detalle de facturas</h3><p className="sub">{filtered.length} resultados</p></div>
        <div className="tbl-wrap" style={{ maxHeight: 460, overflowY: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Factura</th><th>Fecha</th><th>Hora</th><th>Cajero</th><th>Items</th><th>Método</th><th className="num">Total</th></tr></thead>
            <tbody>
              {pagRep.slice.map(f => (
                <tr key={f.id} className="row-hover">
                  <td className="mono">{f.id}</td>
                  <td className="mono">{f.fecha}</td>
                  <td className="mono muted">{f.hora}</td>
                  <td>{f.cajero}</td>
                  <td className="mono">{f.items.reduce((s,i)=>s+i.q,0)}</td>
                  <td><span className="chip">{f.metodo}</span></td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && <Pagination {...pagRep} label="facturas"/>}
      </div>
    </>
  );
};

// =================== Ajustes (solo admin) ===================
const Ajustes = () => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  const [apiKey, setApiKey] = useStateA(cfg.ia_api_key || "");
  const [urlApi, setUrlApi] = useStateA(cfg.ia_url || "");
  const [showKey, setShowKey] = useStateA(false);
  const [saved, setSaved] = useStateA(false);
  const [saving, setSaving] = useStateA(false);
  const [testing, setTesting] = useStateA(false);
  const [testResult, setTestResult] = useStateA(null);

  const detected = detectFromUrl(urlApi);

  const guardar = async () => {
    setSaving(true);
    await DB.saveConfigBatch({
      ia_provider: detected.provider,
      ia_api_key: apiKey.trim(),
      ia_model: detected.model,
      ia_url: urlApi.trim(),
      ia_format: detected.format,
    });
    setSaving(false);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2500);
  };

  const borrarKey = async () => {
    setApiKey("");
    setSaved(false);
    setTestResult(null);
    await DB.saveConfig("ia_api_key", "");
  };

  const probarConexion = async () => {
    if (!apiKey.trim() || !urlApi.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      if (detected.format === "gemini") {
        let u = urlApi.trim().split("?")[0].replace(/\/+$/, "");
        if (!u.includes("/models/")) u += `/models/${detected.model}`;
        else u = u.replace(/:generateContent$/, "");
        const r = await fetch(u + `?key=${apiKey.trim()}`);
        if (!r.ok) throw new Error();
      } else if (detected.format === "claude") {
        const r = await fetch(urlApi.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: detected.model, max_tokens: 10, messages: [{ role: "user", content: "ping" }] }),
        });
        if (!r.ok) throw new Error();
      } else {
        const base = urlApi.trim().replace(/\/chat\/completions\/?$/, "/models");
        const r = await fetch(base, { headers: { "Authorization": `Bearer ${apiKey.trim()}` } });
        if (!r.ok) throw new Error();
      }
      setTestResult("ok");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h2><Icon name="settings" size={20}/> Ajustes</h2>
          <p className="sub">Configuración general del sistema</p>
        </div>
      </div>

      {/* ── Card: Escáner IA ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
            <h3>Escáner IA de facturas</h3>
          </div>
          <p className="sub">Pega la URL y el token de tu proveedor de IA (Gemini, OpenAI, Claude, Groq, etc.)</p>
        </div>
        <div className="card-b">
          <div className="field" style={{ margin: "0 0 12px 0" }}>
            <label>Endpoint URL</label>
            <input
              className="mono"
              value={urlApi}
              onChange={e => { setUrlApi(e.target.value); setSaved(false); setTestResult(null); }}
              placeholder="https://generativelanguage.googleapis.com/v1beta"
              style={{ fontSize: 12 }}
            />
          </div>

          {urlApi && (
            <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Proveedor detectado</label>
                <input value={detected.format === "gemini" ? "Google Gemini" : detected.format === "claude" ? "Anthropic Claude" : "OpenAI Compatible"} readOnly style={{ background: "var(--surface-2)", color: "var(--text-3)", cursor: "default" }}/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Modelo</label>
                <input className="mono" value={detected.model} readOnly style={{ background: "var(--surface-2)", color: "var(--text-3)", cursor: "default" }}/>
              </div>
            </div>
          )}

          <div className="field" style={{ margin: "0 0 12px 0" }}>
            <label>API Key / Token</label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                className="mono"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
                placeholder="tu-api-key"
                style={{ width: "100%", paddingRight: 32 }}
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 11, padding: 0 }}
                title={showKey ? "Ocultar" : "Mostrar"}
              >{showKey ? "🙈" : "👁"}</button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary sm" onClick={guardar} disabled={!apiKey.trim() || !urlApi.trim() || saving}>{saving ? "Guardando…" : "Guardar"}</button>
            <button className="btn sm ghost" onClick={probarConexion} disabled={!apiKey.trim() || !urlApi.trim() || testing}>
              {testing ? "Probando…" : "Probar conexión"}
            </button>
            {apiKey && (
              <button className="btn ghost sm" onClick={borrarKey} title="Borrar key"><Icon name="x" size={14}/></button>
            )}
            {saved && (
              <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="check" size={14}/> Guardado
              </span>
            )}
            {testResult === "ok" && (
              <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="check" size={14}/> Conexión OK
              </span>
            )}
            {testResult === "error" && (
              <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 500 }}>URL o Key inválida</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Sidebar, Hub, Dashboard, Inventario, Ingreso, Vencimientos, Proveedores, Cajeros, Reportes, Ajustes });
