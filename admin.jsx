// Panel admin: Reporte de ventas + Ajustes.
// Helpers compartidos en admin-utils.js; los demas componentes admin en admin-*.jsx.
// useStateA / useMemoA se declaran una sola vez en admin-utils.js (scope global compartido).

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

      <div className="kpi-grid tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi"><div className="label">Total filtrado</div><div className="val">{window.fmtCOP(totalFiltro)}</div><div className="muted" style={{ fontSize: 12 }}>{tickets} facturas</div></div>
        <div className="kpi"><div className="label">Ticket promedio</div><div className="val">{window.fmtCOP(promedio)}</div></div>
        <div className="kpi"><div className="label">Productos vendidos</div><div className="val">{filtered.reduce((s,f) => s + f.items.reduce((a,i)=>a+i.q, 0), 0)}</div></div>
      </div>

      <div className="mt-3 tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.4fr_1fr] tw-gap-[10px] tw-items-start">
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
        {/* Desktop: tabla */}
        <div className="tbl-wrap tw-hidden md:tw-block" style={{ maxHeight: 460, overflowY: "auto" }}>
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
        {/* Mobile: tarjetas */}
        <div className="tw-flex tw-flex-col tw-gap-2.5 md:tw-hidden tw-p-3">
          {filtered.length === 0
            ? <div className="empty-state">Sin facturas con estos filtros.</div>
            : pagRep.slice.map(f => (
              <div key={f.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-mb-2">
                  <div>
                    <div className="tw-font-semibold tw-text-sm mono">{f.id}</div>
                    <div className="muted mono tw-text-xs">{f.fecha} · {f.hora}</div>
                  </div>
                  <span className="num mono tw-font-semibold tw-whitespace-nowrap">{window.fmtCOP(f.total)}</span>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Cajero:</span> <span className="tw-font-medium">{f.cajero}</span></div>
                  <div><span className="muted">Items:</span> <span className="mono tw-font-medium">{f.items.reduce((s,i)=>s+i.q,0)}</span></div>
                  <div className="tw-col-span-2 tw-mt-0.5"><span className="chip">{f.metodo}</span></div>
                </div>
              </div>
            ))}
        </div>
        {filtered.length > 0 && <Pagination {...pagRep} label="facturas"/>}
      </div>
    </>
  );
};

// =================== Ajustes (solo admin) ===================
const Ajustes = () => {
  const cfg = (window.MOCK && window.MOCK.configuracion) || {};
  const initId = cfg.ia_provider || "gemini";
  const initPreset = IA_PRESETS.find(p => p.id === initId) || IA_PRESETS[0];

  const [providerId, setProviderId] = useStateA(initId);
  const [apiKey, setApiKey] = useStateA(cfg.ia_api_key || "");
  const [modelo, setModelo] = useStateA(cfg.ia_model || initPreset.model);
  const [urlApi, setUrlApi] = useStateA(cfg.ia_url || initPreset.url);
  const [formato, setFormato] = useStateA(cfg.ia_format || initPreset.format);
  const [showKey, setShowKey] = useStateA(false);
  const [saved, setSaved] = useStateA(false);
  const [saving, setSaving] = useStateA(false);
  const [testing, setTesting] = useStateA(false);
  const [testResult, setTestResult] = useStateA(null);

  const preset = IA_PRESETS.find(p => p.id === providerId) || IA_PRESETS[IA_PRESETS.length - 1];

  const cambiarProveedor = (id) => {
    const pr = IA_PRESETS.find(p => p.id === id) || IA_PRESETS[IA_PRESETS.length - 1];
    setProviderId(id);
    setModelo(pr.model);
    setUrlApi(pr.url);
    setFormato(pr.format);
    setApiKey("");
    setSaved(false);
    setTestResult(null);
  };

  const guardar = async () => {
    setSaving(true);
    await DB.config.saveBatch({
      ia_provider: providerId,
      ia_api_key: apiKey.trim(),
      ia_model: modelo.trim(),
      ia_url: urlApi.trim(),
      ia_format: formato,
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
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      if (formato === "gemini") {
        const m = modelo.trim() || "gemini-2.0-flash";
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}?key=${apiKey.trim()}`);
        if (!r.ok) throw new Error();
      } else if (formato === "claude") {
        const endpoint = urlApi.trim() || "https://api.anthropic.com/v1/messages";
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: modelo.trim(), max_tokens: 10, messages: [{ role: "user", content: "ping" }] }),
        });
        if (!r.ok) throw new Error();
      } else {
        const endpoint = urlApi.trim() || "https://api.openai.com/v1/chat/completions";
        const base = endpoint.replace(/\/chat\/completions\/?$/, "/models");
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

      {/* ── Card: Proveedor de IA ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
            <h3>Proveedor de IA</h3>
          </div>
          <p className="sub">Escáner de facturas</p>
        </div>
        <div className="card-b">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {IA_PRESETS.map(p => (
              <button key={p.id}
                className={"btn" + (providerId === p.id ? " primary" : " ghost")}
                onClick={() => cambiarProveedor(p.id)}
                style={{ fontSize: 12, fontWeight: providerId === p.id ? 600 : 400, width: "100%", padding: "10px 8px" }}
              >{p.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card: Configuración de conexión ── */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="settings" size={16}/>
            <h3>Configuración de conexión</h3>
          </div>
        </div>
        <div className="card-b">
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Formato de API</label>
              <select value={formato} onChange={e => { setFormato(e.target.value); setSaved(false); }}>
                <option value="openai">OpenAI Compatible</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Modelo</label>
              <input
                className="mono"
                value={modelo}
                onChange={e => { setModelo(e.target.value); setSaved(false); }}
                placeholder="nombre-del-modelo"
              />
            </div>
          </div>
          {formato !== "gemini" && (
            <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
              <label>URL del endpoint</label>
              <input
                className="mono"
                value={urlApi}
                onChange={e => { setUrlApi(e.target.value); setSaved(false); }}
                placeholder={formato === "openai" ? "https://api.ejemplo.com/v1/chat/completions" : "https://api.anthropic.com/v1/messages"}
                style={{ fontSize: 12 }}
              />
            </div>
          )}
          <p className="muted" style={{ fontSize: 11, marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
            Groq, Together, Mistral, DeepSeek, Ollama, LM Studio, OpenRouter usan formato OpenAI Compatible.
          </p>
        </div>
      </div>

      {/* ── Card: API Key ── */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <h3>API Key</h3>
          </div>
        </div>
        <div className="card-b">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", position: "relative", minWidth: 0 }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
                placeholder={preset.placeholder}
                style={{ width: "100%", fontSize: 13, padding: "8px 36px 8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "monospace" }}
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 11, padding: 0 }}
                title={showKey ? "Ocultar" : "Mostrar"}
              >{showKey ? "🙈" : "👁"}</button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn primary sm" onClick={guardar} disabled={!apiKey.trim() || !modelo.trim() || saving}>{saving ? "Guardando…" : "Guardar"}</button>
              {apiKey && (
                <button className="btn ghost sm" onClick={borrarKey} title="Borrar"><Icon name="x" size={14}/></button>
              )}
            </div>
          </div>

          {saved && (
            <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
              <Icon name="check" size={14}/> Configuración guardada en la nube
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn sm ghost" onClick={probarConexion} disabled={!apiKey.trim() || testing}>
              {testing ? "Probando…" : "Probar conexión"}
            </button>
            {testResult === "ok" && (
              <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="check" size={14}/> Conexión exitosa
              </span>
            )}
            {testResult === "error" && (
              <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 500 }}>API Key inválida o sin permisos</span>
            )}
          </div>

          {preset.link && (
            <p className="muted" style={{ fontSize: 11, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
              Obtén tu key en <a href={preset.link} target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>{preset.linkLabel}</a>.
            </p>
          )}
        </div>
      </div>
    </>
  );
};


Object.assign(window, { Reportes, Ajustes });
