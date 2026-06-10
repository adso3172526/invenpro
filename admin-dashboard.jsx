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
  const sparkData = MOCK.ventasHoy.map(h => h.v);
  const totalHoy = MOCK.ventasHoy.reduce((s, h) => s + h.v, 0);
  const ventasCajeroHoy = MOCK.ventasCajero.map(c => ({ ...c, hoy: Math.round(c.total / 30 * (0.6 + Math.random()*0.8)) }));
  const maxHora = Math.max(...MOCK.ventasHoy.map(h => h.v));
  const horaPico = MOCK.ventasHoy.find(h => h.v === maxHora);

  return (
    <div className="dash tw-grid tw-gap-3 md:tw-gap-[12px]">
      {/* Header */}
      <div className="page-h dash-h tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-2 tw-p-3 md:tw-p-4 tw-rounded-lg">
        <div>
          <h2 className="tw-text-lg md:tw-text-[22px] tw-font-bold tw-m-0">Buen día, admin</h2>
          <p className="sub tw-text-xs tw-mt-0.5">Resumen de hoy — viernes 8 de mayo, 2026</p>
        </div>
        <button className="btn tw-w-full sm:tw-w-auto tw-justify-center" onClick={() => exportXlsx("InvenPro_resumen_hoy.xlsx", [
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

      {/* KPIs */}
      <div className="kpi-grid dash-kpi tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi">
          <div className="label"><Icon name="cart" size={13}/> Ventas hoy</div>
          <div className="val">{window.fmtCOP(totalHoy)}</div>
          <div className="delta up"><Icon name="arrowUp" size={11}/> +12.4% vs ayer</div>
          <div className="spark tw-hidden md:tw-block"><Spark data={sparkData} color="var(--accent)"/></div>
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
          <div className="delta tw-truncate">5 por vencer · 7 stock bajo</div>
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
          <div className="card-b tw-flex-1 tw-min-h-0 tw-overflow-x-auto">
            <div className="chart-bars tw-h-[160px] md:tw-h-full md:tw-min-h-[240px] tw-gap-1 md:tw-gap-[14px] tw-px-0.5 md:tw-px-1.5 tw-pt-1.5">
              {MOCK.ventasHoy.map((h, i) => {
                const pct = (h.v/maxHora)*100;
                const isPico = h.v === maxHora;
                return (
                  <div key={h.h} className="col">
                    <div className="bar-wrap">
                      <div className="val mono tw-text-[9px] md:tw-text-[11px]">{(h.v/1000).toFixed(0)}k</div>
                      <div className={"bar" + (isPico ? "" : " alt")} style={{ height: `${pct}%`, animationDelay: `${i*50}ms` }}/>
                    </div>
                    <div className="lbl tw-text-[9px] md:tw-text-[11px]">{h.h}h</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card tw-flex tw-flex-col tw-overflow-hidden tw-min-h-0 md:tw-min-h-[280px]">
          <div className="card-h tw-flex-shrink-0 tw-p-3 md:tw-p-[14px_18px]">
            <div>
              <h3 className="tw-text-sm md:tw-text-[15px] tw-font-semibold tw-m-0">Cajeros en turno · hoy</h3>
              <p className="sub tw-text-xs">Ventas acumuladas</p>
            </div>
          </div>
          <div className="tbl-wrap tw-flex-1 tw-min-h-0 tw-overflow-auto">
            <table className="tbl">
              <tbody>
                {ventasCajeroHoy.sort((a,b)=>b.hoy-a.hoy).map((c, i) => {
                  const max = Math.max(...ventasCajeroHoy.map(x => x.hoy));
                  return (
                    <tr key={c.id}>
                      <td style={{ width: 28, color: "var(--text-3)" }} className="mono">{i+1}</td>
                      <td>
                        <div className="tw-font-medium tw-mb-1">{c.nombre}</div>
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
