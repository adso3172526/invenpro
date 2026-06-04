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
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="mobile-menu-h">
          <img src="logo.png" alt="InvenPro" style={{ height: 28, objectFit: "contain" }}/>
          <button className="btn sm ghost" onClick={() => setOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="brand" style={{ paddingTop: 8, justifyContent: "center", display: "flex" }}>
          <img src="logo.png" alt="InvenPro" style={{ height: 36, objectFit: "contain" }}/>
        </div>
        <div className="nav-cards">
          {NAV.map(n => (
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

      <div className="kpi-grid dash-kpi">
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

      <div className="dash-row" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
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

// =================== Inventario ===================
const Inventario = () => {
  const [q, setQ] = useStateA("");
  const [cat, setCat] = useStateA("Todos");
  const [estado, setEstado] = useStateA("Todos");
  const rows = useMemoA(() => {
    return MOCK.productos.filter(p => {
      if (cat !== "Todos" && p.categoria !== cat) return false;
      if (q) {
        const qq = q.toLowerCase().trim();
        if (!(p.nombre.toLowerCase().includes(qq) || p.sku.toLowerCase().includes(qq))) return false;
      }
      if (estado === "Bajo" && p.stock >= p.min) return false;
      if (estado === "Sin stock" && p.stock > 0) return false;
      return true;
    });
  }, [q, cat, estado]);

  const totalValor = rows.reduce((s, p) => s + p.stock * p.costo, 0);
  const bajo = MOCK.productos.filter(p => p.stock < p.min).length;
  const pag = usePagination(rows, 10);
  return (
    <>
      <div className="page-h">
        <div>
          <h2>Inventario</h2>
          <p className="sub">{MOCK.productos.length} productos · {bajo} con stock bajo · valor en bodega {window.fmtCOP(totalValor)}</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportXlsx("InvenPro_inventario.xlsx", [
            { name: "Inventario", rows: rows.map(p => ({
              SKU: p.sku, "Código de barras": p.sku, Producto: p.nombre, Categoría: p.categoria,
              Precio: p.precio, Costo: p.costo, Stock: p.stock, Mínimo: p.min, Unidad: p.unidad, Vence: p.vence || ""
            })) },
          ])}><Icon name="download" size={14}/> Exportar Excel</button>
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
          </select>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="num">Precio</th>
                <th className="num">Costo</th>
                <th>Stock</th>
                <th>Vencimiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pag.slice.map(p => {
                const stockPct = Math.min(100, (p.stock / (p.min * 3)) * 100);
                const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
                const venceDays = window.daysFromNow(p.vence);
                return (
                  <tr key={p.sku} className="row-hover">
                    <td className="mono muted">{p.sku}</td>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td><span className="chip">{p.categoria}</span></td>
                    <td className="num mono">{window.fmtCOP(p.precio)}</td>
                    <td className="num mono muted">{window.fmtCOP(p.costo)}</td>
                    <td style={{ width: 180 }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                        <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                      </div>
                      <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }}/></div>
                    </td>
                    <td>
                      {p.vence ? (
                        <div>
                          <div className="mono" style={{ fontSize: 12 }}>{p.vence}</div>
                          {venceDays <= 14 && (
                            <span className={"chip " + (venceDays <= 5 ? "bad" : "warn")} style={{ marginTop: 2 }}>
                              {venceDays <= 0 ? "Vencido" : `En ${venceDays}d`}
                            </span>
                          )}
                        </div>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td className="num">
                      <button className="btn sm ghost"><Icon name="eye" size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination {...pag} label="productos"/>
      </div>
    </>
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
  const [showQrScanner, setShowQrScanner] = useStateA(false);
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
  const ingresosFiltrados = MOCK.ingresos.filter(i => i.fecha >= desde && i.fecha <= hasta);
  const pagIng = usePagination(ingresosFiltrados, 10);

  const add = (sku, qty, costo, vence) => {
    const p = MOCK.productos.find(x => x.sku === sku);
    const nombre = p ? p.nombre : sku;
    setItems(it => [...it, { sku, nombre, qty: parseInt(qty)||0, costo: parseInt(costo)||0, vence, nuevo: !p }]);
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
    setItems(data.items.map(it => ({
      sku: it.sku || ("NUEVO-" + Math.floor(Math.random()*9999)),
      nombre: it.nombre,
      qty: it.qty,
      costo: it.costo,
      vence: it.vence,
      nuevo: !!it.nuevo || !it.encontrado,
      confianza: it.confianza,
    })));
    setOrigen(modo);
    setShowQrScanner(false);
    setShowIaScanner(false);
    setShowForm(true);
  };

  const iniciarManual = () => {
    setItems([]); setVendedor(""); setCelular("");
    setFactura("FV-" + Math.floor(Math.random()*9000+1000));
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
          <button className="btn" onClick={() => setShowProv(true)}><Icon name="users" size={14}/> Crear proveedor</button>
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
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>N° ingreso</th><th>Fecha</th><th>Proveedor</th><th className="num">Items</th><th className="num">Costo total</th><th>Recibido por</th><th></th></tr></thead>
            <tbody>
              {pagIng.slice.map(i => (
                <tr key={i.id} className="row-hover" style={{ cursor: "pointer" }} onClick={() => setVerIngreso(i)}>
                  <td className="mono">{i.id}</td>
                  <td>{i.fecha}</td>
                  <td>{i.proveedor}</td>
                  <td className="num mono">{i.items}</td>
                  <td className="num mono">{window.fmtCOP(i.costo)}</td>
                  <td className="muted">{i.recibe}</td>
                  <td className="num"><button className="btn sm ghost" onClick={e => { e.stopPropagation(); setVerIngreso(i); }}><Icon name="eye" size={13}/></button></td>
                </tr>
              ))}
              {ingresosFiltrados.length === 0 && (
                <tr><td colSpan="7" className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ingresos en el rango seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination {...pagIng} label="ingresos"/>
      </div>

      {verIngreso && (
        <Modal title={`Detalle del ingreso ${verIngreso.id}`} lg onClose={() => setVerIngreso(null)} footer={
          <>
            <button className="btn ghost" onClick={() => setVerIngreso(null)}>Cerrar</button>
            <button className="btn" onClick={() => {
              const rows = (verIngreso.detalle || []).map(d => ({
                SKU: d.sku, Producto: d.nombre, Cantidad: d.qty,
                "Costo unit.": d.costo, Subtotal: d.qty * d.costo, Vence: d.vence || "",
              }));
              exportXlsx(`ingreso_${verIngreso.id}.xlsx`, [{ name: "Detalle", rows }]);
            }}><Icon name="download" size={14}/> Exportar este ingreso</button>
          </>
        }>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div><span className="muted" style={{ fontSize: 12 }}>Proveedor</span><div style={{ fontWeight: 500 }}>{verIngreso.proveedor}</div></div>
            <div><span className="muted" style={{ fontSize: 12 }}>Factura</span><div className="mono">{verIngreso.factura || "—"}</div></div>
            <div><span className="muted" style={{ fontSize: 12 }}>Fecha</span><div className="mono">{verIngreso.fecha}</div></div>
            <div><span className="muted" style={{ fontSize: 12 }}>Recibido por</span><div>{verIngreso.recibe}</div></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Producto</th><th>SKU</th><th className="num">Cant.</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {(verIngreso.detalle || []).map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{d.nombre}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{d.sku}</td>
                    <td className="num mono">{d.qty}</td>
                    <td className="num mono">{window.fmtCOP(d.costo)}</td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{d.vence || "—"}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(d.qty * d.costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", background: "var(--surface-2)", marginTop: 8, borderRadius: 8 }}>
            <span className="muted">{(verIngreso.detalle || []).length} producto(s) · {(verIngreso.detalle || []).reduce((s,d)=>s+d.qty,0)} unidades</span>
            <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(verIngreso.costo)}</span>
          </div>
        </Modal>
      )}

      {showSelector && (
        <Modal title="¿Cómo deseas registrar el ingreso?" lg onClose={() => setShowSelector(false)}>
          <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 13 }}>
            Selecciona el método de captura. En cualquiera podrás revisar y editar los datos antes de guardar.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <button className="method-card" onClick={iniciarManual}>
              <div className="method-icon" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}><Icon name="edit" size={24}/></div>
              <div className="method-title">Manual</div>
              <div className="method-desc">Captura los datos uno por uno desde el formulario.</div>
              <div className="method-tag">Tradicional</div>
            </button>
            <button className="method-card" onClick={() => { setShowSelector(false); setShowQrScanner(true); }}>
              <div className="method-icon" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h3v3M21 14v7h-7M17 17v4"/>
                </svg>
              </div>
              <div className="method-title">Escanear QR DIAN</div>
              <div className="method-desc">Lee el código QR de la factura electrónica para importar los datos exactos.</div>
              <div className="method-tag accent">Más rápido</div>
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

      {showQrScanner && (
        <QrScannerModal onClose={() => setShowQrScanner(false)} onRead={(data) => aplicarDatosExtraidos(data, "qr")}/>
      )}

      {showIaScanner && (
        <IaScannerModal onClose={() => setShowIaScanner(false)} onRead={(data) => aplicarDatosExtraidos(data, "ia")}/>
      )}

      {showForm && (
        <Modal title="Confirmar ingreso de mercancía" lg onClose={() => { setShowForm(false); setOrigen(null); }} footer={
          <>
            <button className="btn ghost" onClick={() => { setShowForm(false); setOrigen(null); }}>Cancelar</button>
            <button className="btn accent" disabled={items.length === 0} onClick={() => {
              setShowForm(false); setItems([]); setVendedor(""); setCelular(""); setOrigen(null);
              setToast("Ingreso registrado · stock actualizado");
            }}><Icon name="check"/> Confirmar ingreso</button>
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
          )}          <div className="grid-2">
            <div className="field">
              <label>Proveedor</label>
              <select value={proveedor} onChange={e => setProveedor(e.target.value)}>
                {proveedores.map(p => <option key={p.nit}>{p.nombre}</option>)}
              </select>
              {(() => {
                const p = proveedores.find(x => x.nombre === proveedor);
                return p ? (
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>NIT {p.nit} · {p.tel}</div>
                ) : null;
              })()}
            </div>
            <div className="field">
              <label>N° factura proveedor</label>
              <input className="mono" value={factura} onChange={e => setFactura(e.target.value)}/>
            </div>
            <div className="field">
              <label>Nombre del vendedor</label>
              <input value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Ej: Carlos Pérez"/>
            </div>
            <div className="field">
              <label>Celular vendedor</label>
              <input className="mono" value={celular} onChange={e => setCelular(e.target.value.replace(/[^\d\s+()-]/g,""))} placeholder="300 123 4567"/>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Fecha y hora de recibo</label>
              <input type="datetime-local" value={recibido} onChange={e => setRecibido(e.target.value)}/>
            </div>
          </div>

          <ItemAdder onAdd={add}/>

          {items.length > 0 && (
            <div className="card mt-2">
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Producto</th><th className="num">Cantidad</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th><th></th></tr></thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className={it.nuevo ? "row-nuevo" : ""}>
                        <td>
                          <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            {it.nombre}
                            {it.nuevo && <span className="chip warn" style={{ fontSize: 9 }}>NUEVO</span>}
                            {it.confianza !== undefined && it.confianza < 0.9 && (
                              <span className="chip" style={{ fontSize: 9, background: "#FFF1D6", color: "#8C6A1E" }}>
                                IA {Math.round(it.confianza*100)}%
                              </span>
                            )}
                          </div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{it.sku}</div>
                        </td>
                        <td className="num">
                          <input className="cell-input mono" value={it.qty} onChange={e => actualizarItem(i, "qty", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
                        </td>
                        <td className="num">
                          <input className="cell-input mono" value={it.costo} onChange={e => actualizarItem(i, "costo", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
                        </td>
                        <td>
                          <input className="cell-input mono" type="date" value={it.vence || ""} onChange={e => actualizarItem(i, "vence", e.target.value)}/>
                        </td>
                        <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(it.qty * it.costo)}</td>
                        <td><button className="btn sm ghost" onClick={() => setItems(items.filter((_,j) => j !== i))}><Icon name="x" size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", background: "var(--surface-2)" }}>
                <span className="muted">{items.length} producto(s) · {items.reduce((s,i)=>s+i.qty,0)} unidades</span>
                <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(total)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}

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
const IaScannerModal = ({ onClose, onRead }) => {
  const [estado, setEstado] = useStateA("listo"); // listo | capturando | analizando | exito
  const [progreso, setProgreso] = useStateA(0);
  const tomarFoto = () => {
    setEstado("capturando");
    setTimeout(() => {
      setEstado("analizando");
      let p = 0;
      const interval = setInterval(() => {
        p += 8 + Math.random()*10;
        if (p >= 100) { p = 100; clearInterval(interval); setEstado("exito"); setTimeout(() => onRead(MOCK_OCR_IA), 900); }
        setProgreso(Math.round(p));
      }, 220);
    }, 800);
  };
  return (
    <Modal title="Fotografiar factura" onClose={onClose} lg>
      <p className="muted" style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>
        Toma una foto clara de la factura del proveedor. Una IA leerá automáticamente proveedor, productos, cantidades y costos.
      </p>
      <div className="scanner-frame">
        <div className="scanner-viewport" style={{ background: "#1a1f2e" }}>
          {estado === "listo" && (
            <div className="scanner-placeholder" style={{ color: "#fff" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ marginTop: 12, fontSize: 13 }}>Cámara lista</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Encuadra la factura completa dentro del marco</div>
            </div>
          )}
          {(estado === "capturando" || estado === "analizando") && (
            <>
              <div className="invoice-preview">
                <div className="invoice-line w-100"/>
                <div className="invoice-line w-60"/>
                <div className="invoice-line w-80"/>
                <div className="invoice-line w-40"/>
                <div className="invoice-line w-90"/>
                <div className="invoice-line w-70"/>
                <div className="invoice-line w-50"/>
              </div>
              {estado === "analizando" && (
                <div className="ai-overlay">
                  <div className="ai-status">
                    <div className="ai-spinner"/>
                    Analizando con IA… {progreso}%
                  </div>
                  <div className="ai-progress"><span style={{ width: progreso + "%" }}/></div>
                  <div className="ai-checks">
                    {progreso > 20 && <div>✓ Proveedor identificado</div>}
                    {progreso > 50 && <div>✓ {Math.min(3, Math.floor(progreso/30))} productos detectados</div>}
                    {progreso > 75 && <div>✓ Cantidades y costos extraídos</div>}
                  </div>
                </div>
              )}
            </>
          )}
          {estado === "exito" && (
            <div className="scanner-success">
              <Icon name="check" size={40}/>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Análisis completado</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{MOCK_OCR_IA.items.length} productos detectados</div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-f" style={{ marginTop: 16, borderRadius: 8, borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
        <button className="btn ghost" onClick={onClose} disabled={estado === "analizando"}>Cancelar</button>
        <button className="btn primary" onClick={tomarFoto} disabled={estado !== "listo"}>
          <Icon name="plus" size={14}/>
          {estado === "listo" ? "Tomar foto" : "Procesando…"}
        </button>
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
      <div className="item-adder-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.9fr 0.9fr auto", gap: 8, alignItems: "end" }}>
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
  const guardar = (data) => {
    if (data.id) {
      setList(ps => ps.map(p => p.id === data.id ? { ...p, ...data } : p));
      setToast("Proveedor actualizado");
    } else {
      const nextId = "PRV-" + String(list.length + 1).padStart(3, "0");
      setList(ps => [...ps, { ...data, id: nextId, ingresos: 0, ultimoIngreso: null, estado: "activo" }]);
      setToast("Proveedor creado");
    }
    setEditing(null);
  };

  const toggleEstado = (p) => {
    setList(ps => ps.map(x => x.id === p.id ? { ...x, estado: x.estado === "activo" ? "inactivo" : "activo" } : x));
    setToast(p.estado === "activo" ? "Proveedor dado de baja" : "Proveedor reactivado");
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

      <div className="grid-3 mt-2">
        <div className="card stat">
          <div className="muted" style={{ fontSize: 12 }}>Total proveedores</div>
          <div className="big mono">{list.length}</div>
        </div>
        <div className="card stat">
          <div className="muted" style={{ fontSize: 12 }}>Activos</div>
          <div className="big mono" style={{ color: "var(--good)" }}>{activos}</div>
        </div>
        <div className="card stat">
          <div className="muted" style={{ fontSize: 12 }}>Dados de baja</div>
          <div className="big mono muted">{inactivos}</div>
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
          <table className="tbl">
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

Object.assign(window, { Sidebar, Hub, Dashboard, Inventario, Ingreso, Vencimientos, Proveedores, Cajeros, Reportes });
