// Panel de administración: Reportes + Ajustes (módulos restantes)
const { useState: useStateA, useMemo: useMemoA } = React;

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

  const byMonth = useMemoA(() => {
    const map = {};
    filtered.forEach(f => {
      const k = f.fecha.slice(0,7);
      map[k] = (map[k] || 0) + f.total;
    });
    return Object.entries(map).sort().map(([m,v]) => ({ mes: m, total: v }));
  }, [filtered]);

  const byCajero = useMemoA(() => {
    const map = {};
    filtered.forEach(f => { map[f.cajero] = (map[f.cajero] || 0) + f.total; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([n,v]) => ({ nombre: n, total: v }));
  }, [filtered]);

  const byMetodo = useMemoA(() => {
    const map = {};
    filtered.forEach(f => { map[f.metodo] = (map[f.metodo] || 0) + f.total; });
    const sum = Object.values(map).reduce((a,b)=>a+b, 0) || 1;
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([n,v]) => ({ nombre: n, total: v, pct: (v/sum)*100 }));
  }, [filtered]);

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
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Reporte de ventas</h2>
          <p className="sub">Análisis filtrable por mes, cajero, producto o método de pago.</p>
        </div>
        <button className="btn tw-w-full sm:tw-w-auto" onClick={() => exportXlsx("InvenPro_reporte_ventas.xlsx", [
          { name: "Facturas", rows: filtered.map(f => ({
            Factura: f.id, Fecha: f.fecha, Hora: f.hora, Cajero: f.cajero,
            Items: f.items.reduce((a,i)=>a+i.q, 0), Método: f.metodo, Total: f.total
          })) },
          { name: "Por mes", rows: byMonth.map(x => ({ Mes: x.mes, Total: x.total })) },
          { name: "Por cajero", rows: byCajero.map(x => ({ Cajero: x.nombre, Total: x.total })) },
        ])}><Icon name="download" size={14}/> Exportar reporte</button>
      </div>

      {/* Filtros */}
      <div className="card tw-mb-3">
        <div className="tw-p-3 md:tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2.5">
            <Icon name="search" size={14}/>
            <span className="tw-text-xs tw-font-semibold tw-text-txt-2 tw-uppercase tw-tracking-wider">Filtros</span>
          </div>
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2">
            <div className="field tw-m-0">
              <label className="tw-text-[11px]">Mes</label>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
                {meses.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="field tw-m-0">
              <label className="tw-text-[11px]">Cajero</label>
              <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)}>
                {cajeros.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field tw-m-0">
              <label className="tw-text-[11px]">Producto</label>
              <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}>
                {productosOpts.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field tw-m-0">
              <label className="tw-text-[11px]">Método de pago</label>
              <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
                {metodos.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {(filtroMes !== "Todos" || filtroCajero !== "Todos" || filtroProducto !== "Todos" || filtroMetodo !== "Todos") && (
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
              <span className="muted tw-text-xs">{filtered.length} de {MOCK.facturas.length} facturas</span>
              <button className="btn sm ghost tw-text-xs" onClick={() => { setFiltroMes("Todos"); setFiltroCajero("Todos"); setFiltroProducto("Todos"); setFiltroMetodo("Todos"); }}>
                <Icon name="x" size={11}/> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-2 tw-mb-3">
        <div className="kpi">
          <div className="label"><Icon name="chart" size={14}/> Total filtrado</div>
          <div className="val">{window.fmtCOP(totalFiltro)}</div>
          <div className="muted tw-text-xs">{tickets} facturas</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="cart" size={14}/> Ticket promedio</div>
          <div className="val">{window.fmtCOP(promedio)}</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="box" size={14}/> Productos vendidos</div>
          <div className="val">{filtered.reduce((s,f) => s + f.items.reduce((a,i)=>a+i.q, 0), 0)}</div>
        </div>
      </div>

      {/* Gráficas: ventas por mes + por cajero */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2.5 tw-mb-3 tw-items-stretch">
        <div className="card tw-flex tw-flex-col">
          <div className="card-h"><h3>Ventas por mes</h3><p className="sub">{byMonth.length} mes(es)</p></div>
          <div className="card-b tw-flex-1">
            {byMonth.length > 0 ? (
              <div className="chart-bars tw-h-[160px] lg:tw-h-full" style={{ minHeight: 180 }}>
                {byMonth.map(b => {
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
        <div className="card tw-flex tw-flex-col">
          <div className="card-h"><h3>Por cajero</h3><p className="sub">{byCajero.length} cajero(s)</p></div>
          <div className="tw-flex-1">
            {byCajero.length > 0 ? byCajero.map((c, i) => {
              const max = byCajero[0].total;
              return (
                <div key={c.nombre} className={"tw-px-4 tw-py-3" + (i < byCajero.length - 1 ? " tw-border-b tw-border-border" : "")}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-1.5">
                    <span className="tw-text-[13px] tw-font-medium">{c.nombre}</span>
                    <span className="mono tw-font-semibold tw-text-[13px]">{window.fmtCOP(c.total)}</span>
                  </div>
                  <div className="progress"><span style={{ width: `${(c.total/max)*100}%` }}/></div>
                </div>
              );
            }) : <div className="empty-state">Sin datos.</div>}
          </div>
        </div>
      </div>

      {/* Métodos de pago + Top productos */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2.5 tw-mb-3 tw-items-stretch">
        <div className="card tw-flex tw-flex-col">
          <div className="card-h"><h3>Métodos de pago</h3></div>
          <div className="tw-flex-1">
            {byMetodo.length > 0 ? byMetodo.map((m, i) => (
              <div key={m.nombre} className={"tw-px-4 tw-py-2.5" + (i < byMetodo.length - 1 ? " tw-border-b tw-border-border" : "")}>
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-w-2.5 tw-h-2.5 tw-rounded-full tw-shrink-0" style={{ background: metodoColors[m.nombre] || "var(--text-3)" }}/>
                    <span className="tw-text-[13px] tw-font-medium">{m.nombre}</span>
                  </div>
                  <div className="tw-text-right">
                    <span className="mono tw-font-semibold tw-text-[13px]">{window.fmtCOP(m.total)}</span>
                    <span className="muted tw-text-[11px] tw-ml-1.5">{m.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="progress"><span style={{ width: `${m.pct}%`, background: metodoColors[m.nombre] || "var(--accent)" }}/></div>
              </div>
            )) : <div className="empty-state">Sin datos.</div>}
          </div>
        </div>
        <div className="card tw-flex tw-flex-col">
          <div className="card-h"><h3>Top 5 productos</h3><p className="sub">Por cantidad vendida</p></div>
          <div className="tw-flex-1">
            {topProductosFiltro.length > 0 ? topProductosFiltro.map((p, i) => {
              const maxQ = topProductosFiltro[0].qty;
              return (
                <div key={p.nombre} className={"tw-px-4 tw-py-2.5" + (i < topProductosFiltro.length - 1 ? " tw-border-b tw-border-border" : "")}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-w-5 tw-h-5 tw-rounded tw-bg-accent-soft tw-text-accent tw-grid tw-place-items-center tw-text-[10px] tw-font-bold tw-shrink-0">{i + 1}</span>
                      <span className="tw-text-[13px] tw-font-medium tw-truncate">{p.nombre}</span>
                    </div>
                    <div className="tw-text-right tw-shrink-0 tw-ml-2">
                      <span className="mono tw-font-semibold tw-text-[13px]">{p.qty} und</span>
                    </div>
                  </div>
                  <div className="progress"><span style={{ width: `${(p.qty/maxQ)*100}%` }}/></div>
                </div>
              );
            }) : <div className="empty-state">Sin datos.</div>}
          </div>
        </div>
      </div>

      {/* Detalle de facturas */}
      <div className="card">
        <div className="card-h" id="detalle-facturas"><h3>Detalle de facturas</h3><p className="sub">{filtered.length} resultados</p></div>
        {/* Desktop: tabla */}
        <div className="tbl-wrap tw-hidden md:tw-block tw-max-h-[460px] tw-overflow-y-auto">
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
                  <td className="num mono tw-font-semibold">{window.fmtCOP(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile: tarjetas */}
        <div className="tw-hidden max-md:tw-block tw-p-3">
          <div className="tw-flex tw-flex-col tw-gap-2">
            {pagRep.slice.map(f => (
              <div key={f.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                  <div>
                    <span className="mono tw-font-medium tw-text-sm">{f.id}</span>
                    <span className="muted tw-mx-1.5">·</span>
                    <span className="chip">{f.metodo}</span>
                  </div>
                  <span className="mono tw-font-semibold tw-text-sm">{window.fmtCOP(f.total)}</span>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Fecha:</span> <span className="mono">{f.fecha} {f.hora}</span></div>
                  <div><span className="muted">Cajero:</span> {f.cajero}</div>
                  <div><span className="muted">Items:</span> <span className="mono">{f.items.reduce((s,i)=>s+i.q,0)} productos</span></div>
                </div>
              </div>
            ))}
          </div>
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
    await DB.config.saveBatch({
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
    await DB.config.save("ia_api_key", "");
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
      <div className="card tw-mt-4">
        <div className="card-h">
          <div className="tw-flex tw-items-center tw-gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
            <h3>Escáner IA de facturas</h3>
          </div>
          <p className="sub">Pega la URL y el token de tu proveedor de IA (Gemini, OpenAI, Claude, Groq, etc.)</p>
        </div>
        <div className="card-b">
          <div className="field tw-mb-3" style={{ margin: 0 }}>
            <label>Endpoint URL</label>
            <input
              className="mono tw-text-xs"
              value={urlApi}
              onChange={e => { setUrlApi(e.target.value); setSaved(false); setTestResult(null); }}
              placeholder="https://generativelanguage.googleapis.com/v1beta"
            />
          </div>

          {urlApi && (
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2.5 tw-mb-3">
              <div className="field" style={{ margin: 0 }}>
                <label>Proveedor detectado</label>
                <input value={detected.format === "gemini" ? "Google Gemini" : detected.format === "claude" ? "Anthropic Claude" : "OpenAI Compatible"} readOnly className="tw-bg-surface-2 tw-text-txt-3 tw-cursor-default"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Modelo</label>
                <input className="mono tw-bg-surface-2 tw-text-txt-3 tw-cursor-default" value={detected.model} readOnly/>
              </div>
            </div>
          )}

          <div className="field tw-mb-3" style={{ margin: 0 }}>
            <label>API Key / Token</label>
            <div className="tw-relative">
              <input
                type={showKey ? "text" : "password"}
                className="mono tw-w-full tw-pr-8"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
                placeholder="tu-api-key"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="tw-absolute tw-right-2 tw-top-1/2 tw-bg-transparent tw-border-0 tw-cursor-pointer tw-text-txt-3 tw-text-xs tw-p-0"
                style={{ transform: "translateY(-50%)" }}
                title={showKey ? "Ocultar" : "Mostrar"}
              >{showKey ? "🙈" : "👁"}</button>
            </div>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <button className="btn primary sm tw-flex-1 sm:tw-flex-none" onClick={guardar} disabled={!apiKey.trim() || !urlApi.trim() || saving}>{saving ? "Guardando…" : "Guardar"}</button>
            <button className="btn sm ghost tw-flex-1 sm:tw-flex-none" onClick={probarConexion} disabled={!apiKey.trim() || !urlApi.trim() || testing}>
              {testing ? "Probando…" : "Probar conexión"}
            </button>
            {apiKey && (
              <button className="btn ghost sm" onClick={borrarKey} title="Borrar key"><Icon name="x" size={14}/></button>
            )}
            {saved && (
              <span className="tw-text-xs tw-font-medium tw-flex tw-items-center tw-gap-1" style={{ color: "#22C55E" }}>
                <Icon name="check" size={14}/> Guardado
              </span>
            )}
            {testResult === "ok" && (
              <span className="tw-text-xs tw-font-medium tw-flex tw-items-center tw-gap-1" style={{ color: "#22C55E" }}>
                <Icon name="check" size={14}/> Conexión OK
              </span>
            )}
            {testResult === "error" && (
              <span className="tw-text-xs tw-font-medium" style={{ color: "#EF4444" }}>URL o Key inválida</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Reportes, Ajustes });
