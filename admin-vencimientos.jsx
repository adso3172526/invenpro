// Control de vencimientos

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

  // Realtime: only re-render when config modal is closed
  const [, _rtTick] = React.useState(0);
  const _modalRef = React.useRef(false);
  _modalRef.current = showConfig;
  React.useEffect(() => {
    return window.EventBus.on("realtime:productos", () => {
      if (!_modalRef.current) _rtTick(n => n + 1);
    });
  }, []);

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
      if (next.critico >= next.atencion) next.atencion = next.critico + 1;
      if (next.atencion >= next.preventivo) next.preventivo = next.atencion + 1;
      return next;
    });
  };

  return (
    <>
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Control de vencimientos</h2>
          <p className="sub">Productos próximos a vencer agrupados por urgencia.</p>
        </div>
        <div className="tw-flex tw-gap-2 tw-w-full sm:tw-w-auto">
          <button className="btn tw-flex-1 sm:tw-flex-none" onClick={() => setShowConfig(true)}><Icon name="settings" size={14}/> Configurar alertas</button>
          <button className="btn primary tw-flex-1 sm:tw-flex-none" onClick={enviarTodas}><Icon name="bell" size={14}/> Enviar alertas</button>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 tw-mb-3">
        {[
          { id: "critico",    lbl: `Crítico · ≤ ${umbrales.critico} días`,                          n: buckets.critico.length,    c: "bad" },
          { id: "atencion",   lbl: `Atención · ${umbrales.critico+1}-${umbrales.atencion} días`,    n: buckets.atencion.length,   c: "warn" },
          { id: "preventivo", lbl: `Preventivo · ${umbrales.atencion+1}-${umbrales.preventivo} días`, n: buckets.preventivo.length, c: "accent" },
          { id: "ok",         lbl: `Sin riesgo · más de ${umbrales.preventivo}d`,                   n: buckets.ok.length,         c: "good" },
        ].map(b => (
          <button key={b.id} className="kpi" style={{ textAlign: "left", borderColor: tab === b.id ? "var(--accent)" : undefined, background: tab === b.id ? "var(--accent-soft)" : undefined, cursor: "pointer" }} onClick={() => setTab(b.id)}>
            <div className="label tw-text-xs tw-truncate"><span className={"chip " + b.c}><span className="dot"/></span>{b.lbl}</div>
            <div className="val">{b.n}</div>
          </button>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="card tw-hidden md:tw-block">
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

      {/* Mobile: tarjetas */}
      <div className="tw-block md:tw-hidden">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <span className="tw-font-semibold tw-text-sm">{visible.length} producto(s)</span>
          <span className="muted tw-text-xs">Por fecha de vencimiento</span>
        </div>
        {visible.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="icon"><Icon name="check" size={22}/></div>Sin productos en este grupo.</div></div>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-2.5">
            {pagVis.slice.map(p => {
              const d = window.daysFromNow(p.vence);
              const cls = d < 0 ? "bad" : d <= umbrales.critico ? "bad" : d <= umbrales.atencion ? "warn" : d <= umbrales.preventivo ? "accent" : "good";
              const borderMap = { bad: "var(--bad)", warn: "var(--warn)", accent: "var(--accent)", good: "var(--good)" };
              return (
                <div key={p.sku} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: borderMap[cls] }}>
                  <div className="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-mb-2">
                    <div>
                      <div className="tw-font-medium tw-text-sm">{p.nombre}</div>
                      <div className="muted mono tw-text-xs">{p.sku} · {p.categoria}</div>
                    </div>
                    <span className={"chip " + cls + " tw-whitespace-nowrap"}>{d < 0 ? `Hace ${-d}d` : d === 0 ? "Hoy" : `${d} días`}</span>
                  </div>
                  <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-text-xs">
                    <div><span className="muted">Stock:</span> <span className="mono tw-font-medium">{p.stock} {p.unidad}</span></div>
                    <div><span className="muted">Vence:</span> <span className="mono tw-font-medium">{p.vence}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination {...pagVis} label="productos"/>
      </div>

      {showConfig && (
        <Modal title="Configurar alertas de vencimiento" lg bottomSheet onClose={() => setShowConfig(false)}>
          <h4 className="tw-m-0 tw-mb-2 tw-text-[13px] tw-font-semibold">Umbrales de notificación</h4>
          <p className="muted tw-m-0 tw-mb-3 tw-text-xs">
            Días antes del vencimiento en que el sistema enviará una alerta. Los umbrales se ordenan automáticamente del más urgente al más preventivo.
          </p>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-2 tw-mb-4">
            {[
              { key: "critico", lbl: "Crítico", emoji: "🔴", color: "bad", min: 1, max: 30, desc: "Acción urgente" },
              { key: "atencion", lbl: "Atención", emoji: "🟡", color: "warn", min: 2, max: 60, desc: "Atención requerida" },
              { key: "preventivo", lbl: "Preventivo", emoji: "🔵", color: "accent", min: 3, max: 180, desc: "Aviso anticipado" },
            ].map(t => (
              <div key={t.key} className="tw-border tw-rounded-lg tw-p-3" style={{ borderColor: `var(--${t.color}-soft)`, background: `color-mix(in oklab, var(--${t.color}-soft) 50%, transparent)` }}>
                <div className="muted tw-text-[11px] tw-mb-1" style={{ color: `var(--${t.color})` }}>{t.emoji} {t.lbl}</div>
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <input className="mono tw-w-[60px] tw-py-1.5 tw-px-2 tw-rounded-md tw-border tw-border-border tw-text-sm tw-font-semibold" type="number" min={t.min} max={t.max} value={umbrales[t.key]} onChange={e => ajustarUmbral(t.key, e.target.value)}/>
                  <span className="muted tw-text-xs">días</span>
                </div>
                <div className="muted tw-text-[10px] tw-mt-1">{t.desc}</div>
              </div>
            ))}
          </div>

          <h4 className="tw-m-0 tw-mb-2 tw-text-[13px] tw-font-semibold">Destinatarios de las alertas</h4>
          <p className="muted tw-m-0 tw-mb-3 tw-text-xs">
            Estos correos recibirán las notificaciones automáticas a {umbrales.preventivo}, {umbrales.atencion} y {umbrales.critico} días.
          </p>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-[1fr_1fr_auto] tw-gap-2 tw-items-end tw-mb-3">
            <div className="field tw-m-0">
              <label>Correo</label>
              <input value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="nombre@empresa.co" onKeyDown={e => { if (e.key === "Enter") agregarDest(); }}/>
            </div>
            <div className="field tw-m-0">
              <label>Nombre <span className="muted tw-font-normal">(opcional)</span></label>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Bodega" onKeyDown={e => { if (e.key === "Enter") agregarDest(); }}/>
            </div>
            <button className="btn primary tw-w-full sm:tw-w-auto" onClick={agregarDest}><Icon name="plus" size={14}/> Agregar</button>
          </div>
          <div className="tw-border tw-border-border tw-rounded-lg tw-max-h-[240px] tw-overflow-y-auto">
            {destinatarios.length === 0 ? (
              <div className="empty-state tw-p-6">Sin destinatarios aún.</div>
            ) : destinatarios.map(d => (
              <div key={d.email} className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-border-b tw-border-border last:tw-border-b-0">
                <div>
                  <div className="tw-font-medium tw-text-[13px]">{d.nombre}</div>
                  <div className="mono muted tw-text-[11px]">{d.email}</div>
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

Object.assign(window, { Vencimientos });
