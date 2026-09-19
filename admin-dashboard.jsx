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
  useRealtimeSync("facturas");   // se actualiza al registrarse una venta
  // Total del día POR CAJERO, calculado desde las facturas reales con el
  // ResumenDiarioService (patrón Estrategia). El corte es diario: mañana
  // arranca de cero porque cambia la fecha de hoy. NO acumula días.
  const R = window.Resumenes && window.Resumenes.porCajero;
  const resumen = R ? R.resumen(MOCK.facturas)
                    : { fecha: "", total: 0, transacciones: 0, grupos: [] };
  const totalHoy = resumen.total;
  const transaccionesHoy = resumen.transacciones;
  const ticketPromedio = transaccionesHoy ? Math.round(totalHoy / transaccionesHoy) : 0;
  const ventasPorCajero = resumen.grupos;                // [{ nombre, total, transacciones }]
  const maxCajero = ventasPorCajero.length ? ventasPorCajero[0].total : 0;
  const fechaHoy = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="dash tw-grid tw-gap-3 md:tw-gap-[12px]">
      {/* Header */}
      <div className="page-h dash-h tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-2 tw-p-3 md:tw-p-4 tw-rounded-lg">
        <div>
          <h2 className="tw-text-lg md:tw-text-[22px] tw-font-bold tw-m-0">Buen día, admin</h2>
          <p className="sub tw-text-xs tw-mt-0.5 tw-capitalize">Resumen de hoy — {fechaHoy}</p>
        </div>
        <button className="btn tw-w-full sm:tw-w-auto tw-justify-center" onClick={() => exportXlsx("InvenPro_resumen_hoy.xlsx", [
          { name: "KPIs hoy", rows: [
            { Métrica: "Ventas hoy", Valor: totalHoy },
            { Métrica: "Transacciones", Valor: transaccionesHoy },
            { Métrica: "Ticket promedio", Valor: ticketPromedio },
          ]},
          { name: "Ventas por cajero (hoy)", rows: ventasPorCajero.map(c => ({ Cajero: c.nombre, Transacciones: c.transacciones, Total: c.total })) },
        ])}><Icon name="download" size={14}/> Exportar</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid dash-kpi tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi">
          <div className="label"><Icon name="cart" size={13}/> Ventas hoy</div>
          <div className="val">{window.fmtCOP(totalHoy)}</div>
          <div className="delta">suma del día (reinicia cada día)</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="users" size={13}/> Transacciones</div>
          <div className="val">{transaccionesHoy}</div>
          <div className="delta">facturas de hoy</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="cart" size={13}/> Ticket promedio</div>
          <div className="val">{window.fmtCOP(ticketPromedio)}</div>
          <div className="delta">por venta</div>
        </div>
        <div className="kpi">
          <div className="label"><Icon name="users" size={13}/> Cajeros activos</div>
          <div className="val">{ventasPorCajero.length}</div>
          <div className="delta">con ventas hoy</div>
        </div>
      </div>

      {/* Charts + Cajeros */}
      <div className="dash-row tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.4fr_1fr] tw-gap-[10px]">
        <div className="card tw-flex tw-flex-col tw-overflow-hidden tw-min-h-0 md:tw-min-h-[280px]">
          <div className="card-h tw-flex-shrink-0 tw-p-3 md:tw-p-[14px_18px]">
            <div>
              <h3 className="tw-text-sm md:tw-text-[15px] tw-font-semibold tw-m-0">Ventas del día · por cajero</h3>
              <p className="sub tw-text-xs">Suma de hoy, reinicia cada día</p>
            </div>
          </div>
          <div className="card-b tw-flex-1 tw-min-h-0">
            <div className="tw-relative tw-h-[200px] md:tw-h-full md:tw-min-h-[240px] tw-p-1">
              <ChartCanvas type="bar"
                data={{
                  labels: ventasPorCajero.map(c => c.nombre),
                  datasets: [{
                    data: ventasPorCajero.map(c => c.total),
                    backgroundColor: ventasPorCajero.map(c => c.total === maxCajero ? "--accent" : "--accent/45"),
                    hoverBackgroundColor: "--accent",
                    borderRadius: 5,
                    maxBarThickness: 40,
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
              <p className="sub tw-text-xs">Total y transacciones del día</p>
            </div>
          </div>
          <div className="tbl-wrap tw-flex-1 tw-min-h-0 tw-overflow-auto">
            <table className="tbl">
              <tbody>
                {ventasPorCajero.length > 0 ? ventasPorCajero.map((c, i) => (
                  <tr key={c.nombre}>
                    <td style={{ width: 28, color: "var(--text-3)" }} className="mono">{i+1}</td>
                    <td>
                      <div className="tw-font-medium tw-mb-1">{c.nombre} <span className="muted tw-text-[11px]">· {c.transacciones} venta{c.transacciones === 1 ? "" : "s"}</span></div>
                      <div className="progress"><span style={{ width: `${maxCajero ? (c.total / maxCajero) * 100 : 0}%` }}/></div>
                    </td>
                    <td className="num mono">{window.fmtCOP(c.total)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="tw-text-center tw-text-txt-3 tw-py-6">Sin ventas hoy todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Hub, Dashboard });
