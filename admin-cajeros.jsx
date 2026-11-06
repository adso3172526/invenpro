// Ventas y turnos (equipo de cajeros, turnos, historial de ventas y usuarios)

// Detalle del cierre de caja de un turno (arqueo + desglose por medio de pago)
const CierreDetalleModal = ({ turno, cierre, onClose }) => {
  const c = cierre || {};
  const difColor = c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="modal-bg">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Cierre de caja · {turno.cajero}</h3>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-b">
          <div className="muted tw-text-xs tw-mb-2">Turno {turno.id}{turno.fechaFin ? " · " + turno.fechaFin : ""}</div>
          <div className="card tw-bg-surface-2"><div className="card-b">
            <div className="row spaced"><span className="muted">Base inicial</span><span className="mono">{window.fmtCOP(c.baseInicial)}</span></div>
            <div className="row spaced"><span className="muted">Efectivo</span><span className="mono">{window.fmtCOP(c.ventasEfectivo)}</span></div>
            <div className="row spaced"><span className="muted">Transferencia</span><span className="mono">{window.fmtCOP(c.ventasTransferencia)}</span></div>
            <div className="row spaced"><span className="muted">Nequi</span><span className="mono">{window.fmtCOP(c.ventasNequi)}</span></div>
            <div className="row spaced"><span className="muted">Daviplata</span><span className="mono">{window.fmtCOP(c.ventasDaviplata)}</span></div>
            <div className="row spaced"><span className="muted">Total ventas</span><span className="mono">{window.fmtCOP(c.totalVentas)}</span></div>
            <hr className="tw-border-0 tw-border-t tw-border-border tw-my-2"/>
            <div className="row spaced"><span className="muted">Esperado (efectivo)</span><span className="mono">{window.fmtCOP(c.esperadoEfectivo)}</span></div>
            <div className="row spaced"><span className="muted">Efectivo contado</span><span className="mono">{window.fmtCOP(c.efectivoContado)}</span></div>
            <div className="row spaced"><span className="tw-font-semibold">Diferencia</span><span className="mono tw-font-semibold" style={{ color: difColor }}>{(c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)}</span></div>
          </div></div>
          {c.observaciones ? <div className="tw-mt-3"><div className="muted tw-text-xs tw-mb-1">Observaciones</div><div className="tw-text-sm">{c.observaciones}</div></div> : null}
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// Detalle de una venta: productos vendidos + desglose del pago
const VentaDetalleModal = ({ factura, onClose }) => {
  const [items, setItems] = React.useState(factura.items || []);
  const [pagos, setPagos] = React.useState(factura.pagos || []);
  const [loading, setLoading] = React.useState(false);

  // Red de seguridad: si la factura llegó por realtime sin el detalle anidado,
  // los items vienen vacíos. En ese caso se leen directo de la BD al abrir.
  React.useEffect(() => {
    if ((factura.items && factura.items.length) || !(DB.facturas && DB.facturas.getDetalle)) return;
    setLoading(true);
    DB.facturas.getDetalle(factura.id)
      .then(det => {
        if (!det) return;
        if (det.items && det.items.length) { setItems(det.items); try { factura.items = det.items; } catch (e) {} }
        if (det.pagos && det.pagos.length) { setPagos(det.pagos); try { factura.pagos = det.pagos; } catch (e) {} }
      })
      .catch(e => console.error("getDetalle:", e))
      .finally(() => setLoading(false));
  }, [factura]);

  // Reimprime el recibo reutilizando printReceipt del POS (mismo formato de tirilla).
  // recibido/cambio no se guardan en la factura, así que en la copia van como total/0.
  const reimprimir = () => {
    if (typeof printReceipt !== "function") { console.error("printReceipt no disponible"); return; }
    printReceipt({
      id: factura.id, fecha: factura.fecha, hora: factura.hora,
      cajero: factura.cajero, caja: factura.caja, metodo: factura.metodo,
      total: factura.total, items: items,
      recibido: factura.total, cambio: 0,
    });
  };

  return (
    <Modal title={`Venta ${factura.id}`} lg bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        <button className="btn primary" disabled={!items.length} onClick={reimprimir}><Icon name="print" size={14}/> Reimprimir</button>
      </>
    }>
      <div className="muted tw-text-xs tw-mb-3">{factura.fecha} · {factura.hora} · {factura.cajero}</div>

      {/* Productos */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Productos</div>
      {/* Desktop: tabla */}
      <div className="tbl-wrap tw-mb-4 tw-hidden md:tw-block">
        <table className="tbl">
          <thead><tr><th>Producto</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Subtotal</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.nombre}</td>
                <td className="num mono">{it.q}</td>
                <td className="num mono">{window.fmtCOP(it.precio)}</td>
                <td className="num mono">{window.fmtCOP(it.q * it.precio)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="4" className="muted" style={{ textAlign: "center", padding: 16 }}>{loading ? "Cargando detalle…" : "Sin productos"}</td></tr>}
          </tbody>
        </table>
      </div>
      {/* Mobile: lista */}
      <div className="tw-flex tw-flex-col tw-gap-2 tw-mb-4 md:tw-hidden">
        {items.map((it, i) => (
          <div key={i} className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-border tw-pb-2">
            <div className="tw-min-w-0">
              <div className="tw-text-sm tw-font-medium tw-truncate">{it.nombre}</div>
              <div className="muted mono tw-text-[11px]">{it.q} × {window.fmtCOP(it.precio)}</div>
            </div>
            <div className="mono tw-font-semibold tw-text-sm tw-shrink-0">{window.fmtCOP(it.q * it.precio)}</div>
          </div>
        ))}
        {items.length === 0 && <div className="muted tw-text-sm tw-text-center tw-py-3">{loading ? "Cargando detalle…" : "Sin productos"}</div>}
      </div>

      {/* Pago */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Pago</div>
      <div className="card tw-bg-surface-2"><div className="card-b">
        {pagos.length ? pagos.map((p, i) => (
          <div key={i} className="row spaced"><span className="muted">{p.metodo}</span><span className="mono">{window.fmtCOP(p.monto)}</span></div>
        )) : (
          <div className="row spaced"><span className="muted">{factura.metodo}</span><span className="mono">{window.fmtCOP(factura.total)}</span></div>
        )}
        <hr className="tw-border-0 tw-border-t tw-border-border tw-my-2"/>
        <div className="row spaced"><span className="tw-font-semibold">Total</span><span className="mono tw-font-semibold">{window.fmtCOP(factura.total)}</span></div>
      </div></div>
    </Modal>
  );
};

const Cajeros = () => {
  const [tab, setTab] = useStateA("ventas");
  const [showAdd, setShowAdd] = useStateA(false);
  const [cfgCajero, setCfgCajero] = useStateA(null);
  const [cfgUsuario, setCfgUsuario] = useStateA(null);
  const [toast, setToast] = useStateA(null);
  const [verCierre, setVerCierre] = useStateA(null);  // turno cuyo cierre se muestra
  const [verVenta, setVerVenta] = useStateA(null);    // factura cuyo detalle se muestra
  // Filtros del tab Ventas: por defecto el MES ACTUAL (día 1 → hoy). Fechas YYYY-MM-DD.
  const _fmtF = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const _hoyV = new Date();
  const [vDesde, setVDesde] = useStateA(_fmtF(new Date(_hoyV.getFullYear(), _hoyV.getMonth(), 1)));
  const [vHasta, setVHasta] = useStateA(_fmtF(_hoyV));
  const [vCajero, setVCajero] = useStateA("Todos");
  const [newNombre, setNewNombre] = useStateA("");
  const [newApellido, setNewApellido] = useStateA("");
  const [newDoc, setNewDoc] = useStateA("");
  const [newTel, setNewTel] = useStateA("");
  const [newRol, setNewRol] = useStateA("Cajero");
  const [newUsuario, setNewUsuario] = useStateA("");
  const [newPass, setNewPass] = useStateA("");
  const [savingNew, setSavingNew] = useStateA(false);

  // Realtime: only re-render when no modal is open
  const [, _rtTick] = React.useState(0);
  const _modalRef = React.useRef(false);
  _modalRef.current = showAdd || !!cfgCajero || !!cfgUsuario || !!verVenta;
  React.useEffect(() => {
    const tables = ["cajeros", "turnos", "usuarios_sistema", "facturas"];
    const offs = tables.map(t => window.EventBus.on("realtime:" + t, () => {
      if (!_modalRef.current) _rtTick(n => n + 1);
    }));
    return () => offs.forEach(fn => fn());
  }, []);
  // Red de seguridad: al entrar al módulo relee turnos y cierres desde la BD. El
  // realtime (websocket) puede perder el evento de cierre de turno, dejando MOCK con
  // el estado viejo (turno "abierto" aunque ya se cerró); releer garantiza ver el
  // estado correcto sin recargar la página.
  React.useEffect(() => {
    (async () => {
      try {
        if (DB.turnos && DB.turnos.getAll) {
          const ts = await DB.turnos.getAll();
          if (ts && ts.length && MOCK.setTurnos) MOCK.setTurnos(ts);
        }
        if (DB.cierres && DB.cierres.getAll) {
          const cs = await DB.cierres.getAll();
          if (cs && MOCK.setCierres) MOCK.setCierres(cs);
        }
        _rtTick(n => n + 1);
      } catch (e) { console.error("refrescar turnos/cierres al entrar:", e); }
    })();
  }, []);
  const pagCaj = usePagination(MOCK.cajeros, 10);
  // Turnos del más reciente al más antiguo (por el número del id). Los turnos con
  // cierre son los recientes (ids tipo "T-<timestamp>"), así salen primero y se ve
  // su botón "Detalle"; los viejos "T-20xx" (sin cierre) quedan al final.
  const numTurno = (t) => { const m = String(t.id).match(/(\d+)$/); return m ? Number(m[1]) : 0; };
  const turnosOrdenados = [...MOCK.turnos].sort((a, b) => numTurno(b) - numTurno(a));
  const pagTur = usePagination(turnosOrdenados, 10);
  const cierreDe = (turnoId) => (MOCK.cierres || []).find(c => c.turnoId === turnoId);
  // Ventas: filtrar por rango de fecha + cajero (MOCK.facturas ya viene ordenado
  // de más reciente a más antiguo). Por defecto queda el mes actual.
  const cajerosVentas = useMemoA(
    () => ["Todos", ...Array.from(new Set((MOCK.facturas || []).map(f => f.cajero)))],
    [MOCK.facturas]
  );
  const facturasFiltradas = useMemoA(
    () => (MOCK.facturas || []).filter(f => {
      if (vDesde && f.fecha < vDesde) return false;
      if (vHasta && f.fecha > vHasta) return false;
      if (vCajero !== "Todos" && f.cajero !== vCajero) return false;
      return true;
    }),
    [MOCK.facturas, vDesde, vHasta, vCajero]
  );
  const pagVen = usePagination(facturasFiltradas, 10);

  const currentUser = useMemoA(() => {
    try { return JSON.parse(localStorage.getItem("invenpro-session"))?.user || {}; } catch { return {}; }
  }, []);
  const esSupervisor = currentUser.rol === "Supervisor";

  const usuarios = useMemoA(() =>
    (MOCK.usuarios_sistema || []).filter(u => {
      if (MOCK.cajeros.some(c => c.nombre === u.nombre)) return false;
      if (esSupervisor && u.rol === "Administrador") return false;
      return true;
    }),
    [MOCK.usuarios_sistema, MOCK.cajeros, esSupervisor]
  );
  const pagUsr = usePagination(usuarios, 10);

  return (
    <>
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Ventas y turnos</h2>
          <p className="sub">Consulta las ventas, administra usuarios del POS y supervisa la actividad de cada turno.</p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-w-full sm:tw-w-auto">
          <div className="tab-bar tw-w-full sm:tw-w-auto">
            <button className={tab === "ventas" ? "on" : ""} onClick={() => setTab("ventas")}>Ventas</button>
            <button className={tab === "turnos" ? "on" : ""} onClick={() => setTab("turnos")}>Turnos</button>
            <button className={tab === "equipo" ? "on" : ""} onClick={() => setTab("equipo")}>Equipo</button>
            <button className={tab === "usuarios" ? "on" : ""} onClick={() => setTab("usuarios")}>Usuarios</button>
          </div>
          <button className={"btn primary tw-w-full sm:tw-w-auto " + (tab === "equipo" ? "" : "max-sm:tw-hidden")} onClick={() => setShowAdd(true)}><Icon name="plus" size={14}/> Nuevo cajero</button>
        </div>
      </div>

      {tab === "equipo" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Cajero</th><th>Documento</th><th>Rol</th><th>Estado</th><th>Turno actual</th><th>Ingreso</th><th className="num">Ventas (30d)</th><th></th></tr></thead>
                <tbody>
                  {pagCaj.slice.map(c => (
                    <tr key={c.id} className="row-hover">
                      <td>
                        <div className="row">
                          <div className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs" style={{ color: "var(--accent-ink)" }}>
                            {c.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                          </div>
                          <div>
                            <div className="tw-font-medium">{c.nombre}</div>
                            <div className="muted mono tw-text-[11px]">{c.id}</div>
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
                        <button className="btn sm ghost" onClick={() => setCfgCajero(c)}><Icon name="settings" size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagCaj} label="cajeros"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagCaj.slice.map(c => (
              <div key={c.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs tw-shrink-0" style={{ color: "var(--accent-ink)" }}>
                    {c.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                  </div>
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-font-medium tw-text-sm">{c.nombre}</div>
                    <div className="muted mono tw-text-[11px]">{c.id} · {c.doc}</div>
                  </div>
                  <span className={"chip " + (c.estado === "activo" ? "good" : "bad")}><span className="dot"/>{c.estado}</span>
                  <button className="btn sm ghost" onClick={() => setCfgCajero(c)}><Icon name="settings" size={14}/></button>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Rol:</span> {c.rol}</div>
                  <div><span className="muted">Turno:</span> {c.turnoActivo ? "En turno" : "—"}</div>
                  <div><span className="muted">Ingreso:</span> {c.ingreso}</div>
                  <div><span className="muted">Ventas 30d:</span> <span className="mono">{window.fmtCOP(c.ventas30d)}</span></div>
                </div>
              </div>
            ))}
            <Pagination {...pagCaj} label="cajeros"/>
          </div>
        </>
      )}

      {tab === "turnos" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>N° turno</th><th>Cajero</th><th>Apertura</th><th>Cierre</th><th>Estado</th><th className="num">Base</th><th className="num">Ventas</th><th className="num">Trans.</th><th className="num">Diferencia</th><th></th></tr></thead>
                <tbody>
                  {pagTur.slice.map(t => {
                    const c = cierreDe(t.id);
                    const difColor = !c ? "var(--text-3)" : c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)";
                    return (
                    <tr key={t.id} className="row-hover">
                      <td className="mono">{t.id}</td>
                      <td className="tw-font-medium">{t.cajero}</td>
                      <td className="mono tw-text-xs">{t.fechaIni}</td>
                      <td className="mono tw-text-xs">{t.fechaFin || <span className="muted">—</span>}</td>
                      <td><span className={"chip " + (t.estado === "abierto" ? "good" : "")}>{t.estado === "abierto" ? <><span className="dot"/>abierto</> : "cerrado"}</span></td>
                      <td className="num mono">{window.fmtCOP(t.baseIni)}</td>
                      <td className="num mono">{window.fmtCOP(t.ventas)}</td>
                      <td className="num mono">{t.transacciones}</td>
                      <td className="num mono" style={{ color: difColor, fontWeight: 600 }}>{c ? ((c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)) : "—"}</td>
                      <td>{c ? <button className="btn sm" onClick={() => setVerCierre(t)}>Detalle</button> : <span className="muted">—</span>}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pagTur} label="turnos"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagTur.slice.map(t => {
              const c = cierreDe(t.id);
              return (
              <div key={t.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                  <div>
                    <div className="tw-font-medium tw-text-sm">{t.cajero}</div>
                    <div className="muted mono tw-text-[11px]">Turno {t.id}</div>
                  </div>
                  <span className={"chip " + (t.estado === "abierto" ? "good" : "")}>{t.estado === "abierto" ? <><span className="dot"/>abierto</> : "cerrado"}</span>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Apertura:</span> <span className="mono">{t.fechaIni}</span></div>
                  <div><span className="muted">Cierre:</span> <span className="mono">{t.fechaFin || "—"}</span></div>
                  <div><span className="muted">Base:</span> <span className="mono">{window.fmtCOP(t.baseIni)}</span></div>
                  <div><span className="muted">Ventas:</span> <span className="mono">{window.fmtCOP(t.ventas)}</span></div>
                </div>
                {c && (
                  <div className="tw-flex tw-items-center tw-justify-between tw-mt-2 tw-pt-2 tw-border-t tw-border-border">
                    <span className="tw-text-xs">Diferencia: <span className="mono tw-font-semibold" style={{ color: c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)" }}>{(c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)}</span></span>
                    <button className="btn sm" onClick={() => setVerCierre(t)}>Detalle</button>
                  </div>
                )}
              </div>
              );
            })}
            <Pagination {...pagTur} label="turnos"/>
          </div>
        </>
      )}

      {tab === "ventas" && (
        <>
          {/* Filtros (por defecto: mes actual) — una sola fila para no alargar la vista */}
          <div className="card tw-mb-3"><div className="card-b tw-py-2.5">
            <div className="tw-grid tw-grid-cols-2 sm:tw-flex sm:tw-flex-wrap tw-items-end tw-gap-x-3 tw-gap-y-2">
              <div className="field tw-mb-0"><label>Desde</label><input type="date" value={vDesde} onChange={e => setVDesde(e.target.value)}/></div>
              <div className="field tw-mb-0"><label>Hasta</label><input type="date" value={vHasta} onChange={e => setVHasta(e.target.value)}/></div>
              <div className="field tw-mb-0 tw-col-span-2 sm:tw-col-span-1"><label>Cajero</label><select value={vCajero} onChange={e => setVCajero(e.target.value)}>{cajerosVentas.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <button className="btn sm ghost tw-col-span-2 sm:tw-col-span-1 sm:tw-mb-1" onClick={() => { const h = new Date(); setVDesde(_fmtF(new Date(h.getFullYear(), h.getMonth(), 1))); setVHasta(_fmtF(h)); setVCajero("Todos"); }}>Mes actual</button>
              <span className="muted tw-text-xs tw-col-span-2 sm:tw-col-span-1 sm:tw-ml-auto sm:tw-mb-2">{facturasFiltradas.length} venta(s)</span>
            </div>
          </div></div>

          {/* Desktop: tabla (sin scroll horizontal; solo se muestra en desktop) */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap" style={{ overflowX: "visible" }}>
              <table className="tbl">
                <thead><tr><th>N° Factura</th><th>Fecha</th><th>Hora</th><th>Cajero</th><th className="num">Items</th><th>Método</th><th className="num">Total</th><th></th></tr></thead>
                <tbody>
                  {pagVen.slice.map(f => {
                    const nItems = (f.items || []).reduce((a, i) => a + (i.q || 0), 0);
                    const metodoLabel = (f.pagos && f.pagos.length > 1) ? "Mixto" : f.metodo;
                    return (
                      <tr key={f.id} className="row-hover">
                        <td className="mono">{f.id}</td>
                        <td className="mono tw-text-xs">{f.fecha}</td>
                        <td className="mono tw-text-xs">{f.hora}</td>
                        <td className="tw-font-medium">{f.cajero}</td>
                        <td className="num mono">{nItems}</td>
                        <td><span className="chip">{metodoLabel}</span></td>
                        <td className="num mono">{window.fmtCOP(f.total)}</td>
                        <td className="num"><button className="btn sm" onClick={() => setVerVenta(f)}>Detalle</button></td>
                      </tr>
                    );
                  })}
                  {pagVen.slice.length === 0 && (
                    <tr><td colSpan="8" className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ventas en el rango seleccionado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...pagVen} label="ventas"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagVen.slice.map(f => {
              const nItems = (f.items || []).reduce((a, i) => a + (i.q || 0), 0);
              const metodoLabel = (f.pagos && f.pagos.length > 1) ? "Mixto" : f.metodo;
              return (
                <div key={f.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <div>
                      <div className="tw-font-medium tw-text-sm">{f.cajero}</div>
                      <div className="muted mono tw-text-[11px]">{f.id}</div>
                    </div>
                    <span className="mono tw-font-semibold">{window.fmtCOP(f.total)}</span>
                  </div>
                  <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-mb-2.5">
                    <div><span className="muted">Fecha:</span> <span className="mono">{f.fecha} {f.hora}</span></div>
                    <div><span className="muted">Items:</span> <span className="mono">{nItems}</span></div>
                    <div><span className="muted">Método:</span> {metodoLabel}</div>
                  </div>
                  <button className="btn sm tw-w-full" onClick={() => setVerVenta(f)}><Icon name="eye" size={13}/> Ver detalle</button>
                </div>
              );
            })}
            {pagVen.slice.length === 0 && (
              <div className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ventas en el rango seleccionado</div>
            )}
            <Pagination {...pagVen} label="ventas"/>
          </div>
        </>
      )}

      {tab === "usuarios" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Permisos</th><th></th></tr></thead>
                <tbody>
                  {pagUsr.slice.map(u => (
                    <tr key={u.usuario} className="row-hover">
                      <td className="mono">{u.usuario}</td>
                      <td className="tw-font-medium">{u.nombre}</td>
                      <td><span className="chip">{u.rol}</span></td>
                      <td className="muted tw-text-xs">{u.permisos ? u.permisos.join(", ") : "—"}</td>
                      <td className="num">
                        <button className="btn sm ghost" onClick={() => setCfgUsuario(u)}><Icon name="settings" size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagUsr} label="usuarios"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagUsr.slice.map(u => (
              <div key={u.usuario} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs tw-shrink-0" style={{ color: "var(--accent-ink)" }}>
                    {u.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                  </div>
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-font-medium tw-text-sm">{u.nombre}</div>
                    <div className="muted mono tw-text-[11px]">{u.usuario}</div>
                  </div>
                  <span className="chip">{u.rol}</span>
                  <button className="btn sm ghost" onClick={() => setCfgUsuario(u)}><Icon name="settings" size={14}/></button>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Permisos:</span> {u.permisos ? u.permisos.join(", ") : "—"}</div>
                </div>
              </div>
            ))}
            <Pagination {...pagUsr} label="usuarios"/>
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="Nuevo cajero" bottomSheet onClose={() => setShowAdd(false)} footer={
          <>
            <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn primary" disabled={savingNew} onClick={async () => {
              if (!newNombre.trim() || !newApellido.trim() || !newDoc.trim() || !newUsuario.trim()) {
                setToast("Nombres, apellidos, documento y usuario son obligatorios"); return;
              }
              // Evitar duplicados: mismo nombre normalizado que un cajero ya existente.
              const nombreNorm = window.normalizarNombre(newNombre + " " + newApellido);
              if ((MOCK.cajeros || []).some(c => window.normalizarNombre(c.nombre) === nombreNorm)) {
                setToast(`Ya existe un cajero llamado "${nombreNorm}"`); return;
              }
              setSavingNew(true);
              // Crea cajero + usuario de login de forma atómica (fn_crear_cajero en la BD).
              const { id, error } = await DB.cajeros.create({
                nombres: newNombre, apellidos: newApellido, doc: newDoc,
                rol: newRol, usuario: newUsuario, pass: newPass.trim() || "123456",
              });
              setSavingNew(false);
              if (error) { setToast(error.message || "No se pudo crear el cajero"); return; }
              setShowAdd(false);
              setToast(`Cajero ${id} creado correctamente`);
              setNewNombre(""); setNewApellido(""); setNewDoc(""); setNewTel(""); setNewRol("Cajero"); setNewUsuario(""); setNewPass("");
            }}><Icon name="check"/> {savingNew ? "Creando…" : "Crear cajero"}</button>
          </>
        }>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
            <div className="field"><label>Nombres</label><input value={newNombre} onChange={e => setNewNombre(window.normalizarNombreInput(e.target.value))} placeholder="ej: carolina"/></div>
            <div className="field"><label>Apellidos</label><input value={newApellido} onChange={e => setNewApellido(window.normalizarNombreInput(e.target.value))} placeholder="ej: mendoza"/></div>
            <div className="field"><label>Documento</label><input className="mono" value={newDoc} onChange={e => setNewDoc(e.target.value)} placeholder="C.C."/></div>
            <div className="field"><label>Teléfono</label><input className="mono" value={newTel} onChange={e => setNewTel(e.target.value)} placeholder="+57"/></div>
            <div className="field"><label>Rol</label><select value={newRol} onChange={e => setNewRol(e.target.value)}><option>Cajero</option>{!esSupervisor && <option>Supervisor</option>}</select></div>
            <div className="field"><label>Usuario POS</label><input className="mono" value={newUsuario} onChange={e => setNewUsuario(e.target.value)} placeholder="nombre.apellido"/></div>
            <div className="field sm:tw-col-span-2"><label>Contraseña inicial</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Vacío = 123456 por defecto"/></div>
          </div>
        </Modal>
      )}
      {cfgCajero && <CajeroConfig cajero={cfgCajero} esSupervisor={esSupervisor} onClose={() => setCfgCajero(null)} onDone={(msg) => { setCfgCajero(null); setToast(msg); }}/>}
      {cfgUsuario && <UsuarioConfig usuario={cfgUsuario} esSupervisor={esSupervisor} onClose={() => setCfgUsuario(null)} onDone={(msg) => { setCfgUsuario(null); setToast(msg); }}/>}
      {verCierre && <CierreDetalleModal turno={verCierre} cierre={cierreDe(verCierre.id)} onClose={() => setVerCierre(null)}/>}
      {verVenta && <VentaDetalleModal factura={verVenta} onClose={() => setVerVenta(null)}/>}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// ---- Modal de configuración de cajero ----
const CajeroConfig = ({ cajero, onClose, onDone, esSupervisor }) => {
  const [nombre, setNombre] = useStateA(cajero.nombre);
  const [doc, setDoc] = useStateA(cajero.doc);
  const [rol, setRol] = useStateA(cajero.rol);
  const [estado, setEstado] = useStateA(cajero.estado);
  const [newPass, setNewPass] = useStateA("");
  const [saving, setSaving] = useStateA(false);

  const usuario = useMemoA(() => {
    const u = MOCK.usuarios_sistema.find(u => u.nombre === cajero.nombre);
    return u ? u.usuario : null;
  }, [cajero]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (nombre !== cajero.nombre) updates.nombre = window.normalizarNombre(nombre);
    if (doc !== cajero.doc) updates.doc = doc;
    if (rol !== cajero.rol) updates.rol = rol;
    if (estado !== cajero.estado) updates.estado = estado;

    if (Object.keys(updates).length > 0) {
      const err = await DB.cajeros.update(cajero.id, updates);
      if (!err) {
        const idx = MOCK.cajeros.findIndex(c => c.id === cajero.id);
        if (idx !== -1) Object.assign(MOCK.cajeros[idx], updates);
      }
    }

    if (newPass && usuario) {
      const hashed = await window.hashPass(newPass);
      await DB.cajeros.updateUsuario(usuario, { pass: hashed });
    }

    if (updates.nombre && usuario) {
      const uIdx = MOCK.usuarios_sistema.findIndex(u => u.usuario === usuario);
      if (uIdx !== -1) MOCK.usuarios_sistema[uIdx].nombre = updates.nombre;
      await DB.cajeros.updateUsuario(usuario, { nombre: updates.nombre });
    }

    setSaving(false);
    onDone("Cajero actualizado correctamente");
  };


  const toggleEstado = () => setEstado(estado === "activo" ? "inactivo" : "activo");

  const initials = nombre.split(" ").map(x => x[0]).slice(0,2).join("");

  return (
    <Modal title="Configurar cajero" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving} onClick={handleSave}><Icon name="check"/> Guardar</button>
      </>
    }>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-sm" style={{ color: "var(--accent-ink)" }}>
          {initials}
        </div>
        <div>
          <div className="tw-font-medium">{cajero.nombre}</div>
          <div className="muted mono tw-text-xs">{cajero.id} · {cajero.doc}</div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Datos personales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Nombre</label><input value={nombre} onChange={e => setNombre(window.normalizarNombreInput(e.target.value))}/></div>
        <div className="field"><label>Documento</label><input className="mono" value={doc} onChange={e => setDoc(e.target.value)}/></div>
        <div className="field"><label>Rol</label><select value={rol} onChange={e => setRol(e.target.value)}><option>Cajero</option>{!esSupervisor && <option>Supervisor</option>}</select></div>
      </div>

      {/* Credenciales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Credenciales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Usuario</label><input className="mono" value={usuario || "—"} readOnly style={{opacity:0.6}}/></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Dejar vacío para no cambiar"/></div>
      </div>

      {/* Estado */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Estado</div>
      <button className={"chip " + (estado === "activo" ? "good" : "bad")} onClick={toggleEstado} style={{cursor:"pointer"}}>
        <span className="dot"/>{estado === "activo" ? "Activo" : "Inactivo"} <span className="muted tw-text-[10px] tw-ml-1">(click para cambiar)</span>
      </button>

    </Modal>
  );
};

// ---- Modal de configuración de usuario (no-cajero) ----
const UsuarioConfig = ({ usuario, onClose, onDone, esSupervisor }) => {
  const [nombre, setNombre] = useStateA(usuario.nombre);
  const [rol, setRol] = useStateA(usuario.rol);
  const [newPass, setNewPass] = useStateA("");
  const [saving, setSaving] = useStateA(false);

  const initials = nombre.split(" ").map(x => x[0]).slice(0,2).join("");

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (nombre !== usuario.nombre) updates.nombre = nombre;
    if (rol !== usuario.rol) updates.rol = rol;
    if (newPass) updates.pass = await window.hashPass(newPass);

    if (Object.keys(updates).length > 0) {
      await DB.cajeros.updateUsuario(usuario.usuario, updates);
      const idx = MOCK.usuarios_sistema.findIndex(u => u.usuario === usuario.usuario);
      if (idx !== -1) {
        if (updates.nombre) MOCK.usuarios_sistema[idx].nombre = updates.nombre;
        if (updates.rol) MOCK.usuarios_sistema[idx].rol = updates.rol;
      }
    }

    setSaving(false);
    onDone("Usuario actualizado correctamente");
  };

  return (
    <Modal title="Configurar usuario" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving} onClick={handleSave}><Icon name="check"/> Guardar</button>
      </>
    }>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-sm" style={{ color: "var(--accent-ink)" }}>
          {initials}
        </div>
        <div>
          <div className="tw-font-medium">{usuario.nombre}</div>
          <div className="muted mono tw-text-xs">{usuario.usuario}</div>
        </div>
      </div>

      {/* Datos */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Datos</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Nombre</label><input value={nombre} onChange={e => setNombre(e.target.value)}/></div>
        <div className="field"><label>Rol</label><select value={rol} onChange={e => setRol(e.target.value)}><option>Supervisor</option>{!esSupervisor && <option>Administrador</option>}</select></div>
      </div>

      {/* Credenciales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Credenciales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Usuario</label><input className="mono" value={usuario.usuario} readOnly style={{opacity:0.6}}/></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Dejar vacío para no cambiar"/></div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Cajeros, CajeroConfig, UsuarioConfig, VentaDetalleModal });
