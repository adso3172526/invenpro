// Hub y Dashboard del panel de administración

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

const Dashboard = ({ go }) => {
  useRealtimeSync("views");
  // Ventas por hora REALES: agrupadas por franja horaria desde las facturas del día
  // (módulo resumen/ · PorHoraStrategy). Antes usaba la vista ventas_hoy, que agrupaba
  // por el texto de hora completo ("04:31 p. m.") y rotulaba mal el gráfico.
  const PH = window.Resumenes && window.Resumenes.porHora;
  const ventasHora = PH ? PH.resumen(MOCK.facturas).grupos : [];
  const sparkData = ventasHora.map(h => h.total);
  const maxHora = ventasHora.length ? Math.max(...ventasHora.map(h => h.total)) : 0;
  const horaPico = ventasHora.find(h => h.total === maxHora) || { label: "--", total: 0 };

  // Resumen REAL del día desde las facturas (módulo resumen/, patrón Estrategia).
  // Reemplaza el cálculo anterior de "ventas por cajero" que usaba Math.random,
  // y las transacciones/ticket que daban 0 (la vista ventas_hoy no las trae).
  const R = window.Resumenes && window.Resumenes.porCajero;
  const resumen = R ? R.resumen(MOCK.facturas) : { total: 0, transacciones: 0, grupos: [] };
  const totalHoy = resumen.total;
  const transacciones = resumen.transacciones;
  const ticketPromedio = transacciones > 0 ? Math.round(totalHoy / transacciones) : 0;
  // Forma { id, nombre, hoy, transacciones } para alimentar el render existente
  const ventasCajeroHoy = resumen.grupos.map(c => ({ id: c.nombre, nombre: c.nombre, hoy: c.total, transacciones: c.transacciones }));

  const productos = MOCK.productos || [];
  const umbralesCfg = (MOCK.configuracion && MOCK.configuracion.alerta_umbrales) || null;
  let umbrales = { critico: 8, atencion: 15, preventivo: 30 };
  try { if (umbralesCfg) umbrales = JSON.parse(umbralesCfg); } catch {}
  let vencCount = 0;
  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    if (!p.vence) continue;
    const dias = window.daysFromNow(p.vence);
    if (dias != null && dias <= umbrales.preventivo) vencCount++;
  }
  const stockBajo = productos.filter(p => p.stock < p.min).length;
  const alertasTotal = vencCount + stockBajo;

  return (
    <div className="dash tw-grid tw-gap-3 md:tw-gap-[12px]">
      {/* Header */}
      <div className="page-h dash-h tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-2 tw-p-3 md:tw-p-4 tw-rounded-lg">
        <div>
          <h2 className="tw-text-lg md:tw-text-[22px] tw-font-bold tw-m-0">Buen día, admin</h2>
          <p className="sub tw-text-xs tw-mt-0.5">Resumen de hoy — {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button className="btn tw-w-full sm:tw-w-auto tw-justify-center" onClick={() => exportXlsx("InvenPro_resumen_hoy.xlsx", [
          { name: "KPIs hoy", rows: [
            { Métrica: "Ventas hoy", Valor: totalHoy },
            { Métrica: "Transacciones", Valor: transacciones },
            { Métrica: "Ticket promedio", Valor: ticketPromedio },
            { Métrica: "Alertas", Valor: alertasTotal },
          ]},
          { name: "Ventas por hora", rows: ventasHora.map(h => ({ Hora: h.label + ":00", Total: h.total })) },
          { name: "Ventas por cajero (hoy)", rows: ventasCajeroHoy.map(c => ({ Cajero: c.nombre, Total: c.hoy })) },
        ])}><Icon name="download" size={14}/> Exportar</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid dash-kpi tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi">
          <div className="label"><Icon name="cart" size={13}/> Ventas hoy</div>
          <div className="val">{window.fmtCOP(totalHoy)}</div>
          <div className="spark tw-hidden md:tw-block"><Spark data={sparkData} color="var(--accent)"/></div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="users" size={13}/> Transacciones</div>
          <div className="val">{transacciones}</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="clock" size={13}/> Hora pico</div>
          <div className="val">{horaPico.label}:00</div>
          <div className="delta">{window.fmtCOP(horaPico.total)} facturados</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="alert" size={13}/> Alertas activas</div>
          <div className="val">{alertasTotal}</div>
          <div className="delta tw-truncate">{vencCount} por vencer · {stockBajo} stock bajo</div>
        </div>
      </div>

      {/* Charts + Cajeros */}
      <div className="dash-row tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.4fr_1fr] tw-gap-[10px]">
        <div className="card tw-flex tw-flex-col tw-overflow-hidden tw-min-h-0 md:tw-min-h-[280px]">
          <div className="card-h tw-flex-shrink-0 tw-p-3 md:tw-p-[14px_18px]">
            <div>
              <h3 className="tw-text-sm md:tw-text-[15px] tw-font-semibold tw-m-0">Ventas por hora · hoy</h3>
              <p className="sub tw-text-xs">Distribución del día en curso</p>
            </div>
          </div>
          <div className="card-b tw-flex-1 tw-min-h-0">
            <div className="tw-relative tw-h-[200px] md:tw-h-full md:tw-min-h-[240px] tw-p-1">
              <ChartCanvas type="bar"
                data={{
                  labels: ventasHora.map(h => h.label + "h"),
                  datasets: [{
                    data: ventasHora.map(h => h.total),
                    backgroundColor: ventasHora.map(h => h.total === maxHora ? "--accent" : "--accent/45"),
                    hoverBackgroundColor: "--accent",
                    borderRadius: 5,
                    maxBarThickness: 26,
                  }],
                }}
                options={{
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => " " + window.fmtCOP(ctx.parsed.y) } },
                  },
                  scales: {
                    x: { grid: { display: false }, border: { color: "--border" }, ticks: { color: "--text-3", font: { size: 10 }, maxRotation: 0, autoSkip: true } },
                    y: { grid: { color: "--border/55" }, border: { display: false }, ticks: { color: "--text-3", font: { size: 10 }, maxTicksLimit: 5, callback: v => v >= 1000000 ? (v/1000000) + "M" : (v/1000) + "k" } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="card tw-flex tw-flex-col tw-overflow-hidden tw-min-h-0 md:tw-min-h-[280px]">
          <div className="card-h tw-flex-shrink-0 tw-p-3 md:tw-p-[14px_18px]">
            <div>
              <h3 className="tw-text-sm md:tw-text-[15px] tw-font-semibold tw-m-0">Detalle por cajero · hoy</h3>
              <p className="sub tw-text-xs">Total y ventas del día</p>
            </div>
          </div>
          <div className="tbl-wrap tw-flex-1 tw-min-h-0 tw-overflow-auto">
            <table className="tbl">
              <tbody>
                {ventasCajeroHoy.length === 0 && (
                  <tr><td colSpan={3} className="tw-text-center tw-text-txt-3 tw-py-6">Sin ventas hoy todavía</td></tr>
                )}
                {ventasCajeroHoy.map((c, i) => {
                  const max = ventasCajeroHoy[0].hoy || 1;   // grupos ya vienen ordenados desc
                  return (
                    <tr key={c.id}>
                      <td style={{ width: 28, color: "var(--text-3)" }} className="mono">{i+1}</td>
                      <td>
                        <div className="tw-font-medium tw-mb-1">{c.nombre} <span className="muted tw-text-[11px]">· {c.transacciones} venta{c.transacciones === 1 ? "" : "s"}</span></div>
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

Object.assign(window, { Hub, Dashboard });
