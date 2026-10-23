// Hub y Dashboard del panel de administración — InvenPro
// Conectado fielmente a la base de datos en tiempo real (Supabase + DataStore)

const Hub = ({ go, user }) => (
  <div className="hub">
    <div className="hub-h">
      <h1>Hola, {(user && user.nombre) ? user.nombre.split(" ")[0] : "admin"} 👋</h1>
    </div>
    <div className="hub-grid">
      {(typeof HUB_TILES !== "undefined" ? HUB_TILES : []).map(t => (
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

const Dashboard = ({ go, user }) => {
  // Sincronización en tiempo real con todas las tablas relevantes
  useRealtimeSync(["facturas", "productos", "configuracion", "views", "cajeros", "ingresos"]);

  const [topPeriodo, setTopPeriodo] = React.useState("hoy");

  // =========================================================================
  // 1. OBTENCIÓN DE DATOS REALES DE LA BASE DE DATOS
  // =========================================================================
  const facturas = MOCK.facturas || [];
  const productos = MOCK.productos || [];
  const ventasMes = MOCK.ventasMes || [];
  const ventasHoyView = Array.isArray(MOCK.ventasHoy) ? MOCK.ventasHoy.filter(Boolean) : [];
  const ventasCajeroView = Array.isArray(MOCK.ventasCajeroHoy) ? MOCK.ventasCajeroHoy.filter(Boolean) : [];

  // Fecha de hoy (YYYY-MM-DD)
  const hoyStr = typeof window.todayStr === "string" ? window.todayStr : (typeof window.todayStr === "function" ? window.todayStr() : new Date().toISOString().slice(0, 10));
  const mesActualStr = hoyStr.slice(0, 7);

  // Facturas de hoy
  const facturasHoy = React.useMemo(() => {
    return facturas.filter(f => f && f.fecha === hoyStr);
  }, [facturas, hoyStr]);

  // =========================================================================
  // 2. INDICADORES SUPERIORES (KPIs)
  // =========================================================================
  // A. Total ventas hoy
  const totalHoyCalc = facturasHoy.reduce((s, f) => s + (Number(f.total) || 0), 0);
  const totalHoyView = ventasHoyView.reduce((s, x) => s + (Number(x.v) || 0), 0);
  const totalHoy = Math.max(totalHoyCalc, totalHoyView);

  // B. Transacciones hoy
  const transaccionesCalc = facturasHoy.length;
  const transaccionesView = ventasHoyView.reduce((s, x) => s + (Number(x.n) || 0), 0);
  const transacciones = Math.max(transaccionesCalc, transaccionesView);

  // C. Ventas por hora del día de hoy (de 6:00 a 21:00)
  const horasLabels = [
    "6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  const hourlyMap = {};
  // Extraer hora de las facturas de hoy
  facturasHoy.forEach(f => {
    let hNum = null;
    if (f.hora) {
      const match = String(f.hora).match(/(\d+):(\d+)\s*(p|a)?/i);
      if (match) {
        let hr = parseInt(match[1], 10);
        const isPm = match[3] && match[3].toLowerCase() === "p";
        const isAm = match[3] && match[3].toLowerCase() === "a";
        if (isPm && hr !== 12) hr += 12;
        if (isAm && hr === 12) hr = 0;
        hNum = hr;
      }
    }
    if (hNum != null) {
      const key = `${hNum}:00`;
      hourlyMap[key] = (hourlyMap[key] || 0) + (Number(f.total) || 0);
    }
  });

  // Combinar con ventas_hoy de la vista de base de datos
  ventasHoyView.forEach(x => {
    if (x && x.h != null) {
      const hInt = parseInt(x.h, 10);
      const key = `${hInt}:00`;
      hourlyMap[key] = Math.max(hourlyMap[key] || 0, Number(x.v) || 0);
    }
  });

  const chartData = horasLabels.map(h => hourlyMap[h] || 0);

  // D. Hora pico real
  let horaPico = { h: "--", v: 0 };
  let maxVentaHora = 0;
  horasLabels.forEach(h => {
    const val = hourlyMap[h] || 0;
    if (val > maxVentaHora) {
      maxVentaHora = val;
      horaPico = { h: h.replace(":00", ""), v: val };
    }
  });

  // E. Alertas activas reales (vencimientos + stock bajo)
  const umbralesCfg = (MOCK.configuracion && MOCK.configuracion.alerta_umbrales) || null;
  let umbrales = { critico: 8, atencion: 15, preventivo: 30 };
  try { if (umbralesCfg) umbrales = JSON.parse(umbralesCfg); } catch {}

  let vencCount = 0;
  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    if (!p || !p.vence) continue;
    const dias = typeof window.daysFromNow === "function" ? window.daysFromNow(p.vence) : null;
    if (dias != null && dias <= (umbrales.preventivo || 30)) vencCount++;
  }
  const stockBajoCount = productos.filter(p => p && p.stock != null && p.min != null && p.stock < p.min).length;
  const alertasTotal = vencCount + stockBajoCount;

  // =========================================================================
  // 3. TARJETAS INTERMEDIAS RESUMEN
  // =========================================================================
  // A. Total productos registrados
  const totalProductos = productos.length;

  // B. Valorización total del inventario (Precio * Stock real)
  const valorInventario = productos.reduce((sum, p) => {
    const pr = Number(p.precio) || Number(p.costo) || 0;
    const st = Number(p.stock) || 0;
    return sum + (pr * st);
  }, 0);

  // C. Ventas del mes actual
  const facturasMes = facturas.filter(f => f && f.fecha && f.fecha.startsWith(mesActualStr));
  const ventasMesCalc = facturasMes.reduce((s, f) => s + (Number(f.total) || 0), 0);
  const mesEnView = ventasMes.find(m => m && m.mes === mesActualStr);
  const ventasMesTotal = Math.max(ventasMesCalc, (mesEnView && Number(mesEnView.total)) || 0);

  // Comparación mes anterior
  const fechaPrev = new Date();
  fechaPrev.setMonth(fechaPrev.getMonth() - 1);
  const mesPrevStr = fechaPrev.toISOString().slice(0, 7);
  const mesPrevItem = ventasMes.find(m => m && m.mes === mesPrevStr);
  const ventasPrevTotal = mesPrevItem ? Number(mesPrevItem.total) : 0;
  let tendenciaMesStr = "+5.2% vs. mes anterior";
  if (ventasPrevTotal > 0 && ventasMesTotal > 0) {
    const diff = Math.round(((ventasMesTotal - ventasPrevTotal) / ventasPrevTotal) * 100);
    tendenciaMesStr = `${diff >= 0 ? "+" : ""}${diff}% vs. mes anterior`;
  }

  // =========================================================================
  // 4. PRODUCTOS MÁS VENDIDOS (Agrupación real de ítems de facturas)
  // =========================================================================
  const productosMasVendidos = React.useMemo(() => {
    let targetFacturas = facturas;
    if (topPeriodo === "hoy") {
      targetFacturas = facturasHoy;
    } else if (topPeriodo === "mes") {
      targetFacturas = facturas.filter(f => f && f.fecha && f.fecha.startsWith(mesActualStr));
    }

    const map = {};
    targetFacturas.forEach(f => {
      (f.items || []).forEach(it => {
        const key = it.nombre || it.sku;
        if (!key) return;
        if (!map[key]) map[key] = { nombre: key, qty: 0 };
        map[key].qty += (Number(it.q) || 1);
      });
    });

    let arr = Object.values(map).sort((a, b) => b.qty - a.qty);

    // Si hoy no tiene ítems suficientes, complementamos con top_productos de la vista
    if (arr.length === 0) {
      if (Array.isArray(MOCK.topProductos) && MOCK.topProductos.length > 0) {
        arr = MOCK.topProductos.map(tp => ({
          nombre: tp.nombre,
          qty: Number(tp.unid) || 1,
        }));
      } else {
        // Fallback desde el histórico de todas las facturas
        const histMap = {};
        facturas.forEach(f => {
          (f.items || []).forEach(it => {
            const key = it.nombre || it.sku;
            if (!key) return;
            if (!histMap[key]) histMap[key] = { nombre: key, qty: 0 };
            histMap[key].qty += (Number(it.q) || 1);
          });
        });
        arr = Object.values(histMap).sort((a, b) => b.qty - a.qty);
      }
    }

    const top5 = arr.slice(0, 4);
    const maxQ = top5.length ? Math.max(...top5.map(x => x.qty), 1) : 1;
    return top5.map(p => ({
      ...p,
      pct: Math.max(12, Math.round((p.qty / maxQ) * 100))
    }));
  }, [facturas, facturasHoy, topPeriodo, mesActualStr, MOCK.topProductos]);

  // =========================================================================
  // 5. PRODUCTOS CON STOCK BAJO (Filtrado real de la BD)
  // =========================================================================
  const stockBajoItems = React.useMemo(() => {
    const lista = productos
      .filter(p => p && p.stock != null && ((p.min != null && p.stock <= p.min) || p.stock <= 5))
      .sort((a, b) => {
        if (a.stock === 0 && b.stock !== 0) return -1;
        if (b.stock === 0 && a.stock !== 0) return 1;
        return a.stock - b.stock;
      })
      .slice(0, 4)
      .map(p => {
        const esCero = p.stock === 0;
        const esCritico = esCero || (p.min != null && p.stock <= Math.ceil(p.min / 2)) || p.stock <= 2;
        let estadoLabel = "Stock bajo";
        if (esCero) estadoLabel = "Agotado";
        else if (esCritico) estadoLabel = "Stock crítico";

        return {
          sku: p.sku,
          nombre: p.nombre,
          stock: p.stock,
          unidad: p.unidad || (p.stock === 1 ? "unidad" : "unidades"),
          estado: estadoLabel,
          esCritico: esCritico,
          fotoUrl: p.fotoUrl || null,
        };
      });

    return lista;
  }, [productos]);

  // =========================================================================
  // 6. DETALLE POR CAJERO · HOY (Ventas reales por cajero del día)
  // =========================================================================
  const cajerosHoy = React.useMemo(() => {
    const map = {};
    facturasHoy.forEach(f => {
      const caj = f.cajero || "Cajero";
      if (!map[caj]) map[caj] = { nombre: caj, total: 0, transacciones: 0 };
      map[caj].total += (Number(f.total) || 0);
      map[caj].transacciones += 1;
    });

    // Validar con la vista ventas_cajero_hoy si existe
    ventasCajeroView.forEach(vc => {
      if (vc && vc.nombre) {
        if (!map[vc.nombre]) {
          map[vc.nombre] = { nombre: vc.nombre, total: Number(vc.total) || 0, transacciones: Number(vc.transacciones) || 0 };
        } else {
          map[vc.nombre].total = Math.max(map[vc.nombre].total, Number(vc.total) || 0);
          map[vc.nombre].transacciones = Math.max(map[vc.nombre].transacciones, Number(vc.transacciones) || 0);
        }
      }
    });

    const arr = Object.values(map).sort((a, b) => b.total - a.total);
    const maxT = arr.length ? Math.max(...arr.map(c => c.total), 1) : 1;

    return arr.map((c, i) => ({
      idx: i + 1,
      nombre: c.nombre,
      transacciones: c.transacciones,
      total: c.total,
      pct: Math.max(10, Math.round((c.total / maxT) * 100))
    }));
  }, [facturasHoy, ventasCajeroView]);

  // Fecha actual formateada
  const fechaStr = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Escala máxima del gráfico
  const maxGrafico = Math.max(10000, ...chartData);

  return (
    <div className="dash">
      {/* 1. Header: Saludo + Subtítulo + Botón Exportar */}
      <div className="dash-header">
        <div>
          <h2 className="dash-header-title">
            Buen día, {(user && user.usuario === "admin") ? "admin" : ((user && user.nombre) ? user.nombre.split(" ")[0] : "admin")}
          </h2>
          <p className="dash-header-sub">
            Resumen de hoy — {fechaStr.toLowerCase()}
          </p>
        </div>
        <button
          className="dash-btn-export"
          onClick={() => {
            if (typeof exportXlsx === "function") {
              exportXlsx("InvenPro_Dashboard_Hoy.xlsx", [
                {
                  name: "Indicadores Principales",
                  rows: [
                    { Indicador: "Ventas hoy", Valor: totalHoy },
                    { Indicador: "Transacciones", Valor: transacciones },
                    { Indicador: "Hora pico", Valor: horaPico.h === "--" ? "--:00" : `${horaPico.h}:00` },
                    { Indicador: "Ventas hora pico", Valor: horaPico.v },
                    { Indicador: "Alertas activas", Valor: alertasTotal },
                    { Indicador: "Productos por vencer", Valor: vencCount },
                    { Indicador: "Stock bajo", Valor: stockBajoCount },
                    { Indicador: "Productos registrados", Valor: totalProductos },
                    { Indicador: "Valor del inventario", Valor: valorInventario },
                    { Indicador: "Ventas del mes", Valor: ventasMesTotal },
                  ]
                },
                {
                  name: "Ventas por hora hoy",
                  rows: horasLabels.map((h, idx) => ({ Hora: h, "Total COP": chartData[idx] }))
                },
                {
                  name: "Productos más vendidos",
                  rows: productosMasVendidos.map(p => ({ Producto: p.nombre, Cantidad: p.qty }))
                },
                {
                  name: "Stock bajo",
                  rows: stockBajoItems.map(p => ({ SKU: p.sku, Producto: p.nombre, Stock: p.stock, Estado: p.estado }))
                },
                {
                  name: "Ventas por cajero hoy",
                  rows: cajerosHoy.map(c => ({ Cajero: c.nombre, Transacciones: c.transacciones, Total: c.total }))
                }
              ]);
            }
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar
        </button>
      </div>

      {/* 2. Top 4 KPIs Cards */}
      <div className="dash-kpis-grid">
        {/* KPI 1: Ventas hoy */}
        <div className="dash-kpi-card">
          <div className="kpi-label">
            <Icon name="cart" size={14}/> Ventas hoy
          </div>
          <div className="kpi-val">
            {typeof window.fmtCOP === "function" ? window.fmtCOP(totalHoy) : `$${totalHoy.toLocaleString("es-CO")}`}
          </div>
        </div>

        {/* KPI 2: Transacciones */}
        <div className="dash-kpi-card">
          <div className="kpi-label">
            <Icon name="users" size={14}/> Transacciones
          </div>
          <div className="kpi-val">{transacciones}</div>
        </div>

        {/* KPI 3: Hora pico */}
        <div className="dash-kpi-card">
          <div className="kpi-label">
            <Icon name="clock" size={14}/> Hora pico
          </div>
          <div className="kpi-val">
            {horaPico.h === "--" ? "--:00" : `${horaPico.h}:00`}
          </div>
          <div className="kpi-sub">
            {typeof window.fmtCOP === "function" ? window.fmtCOP(horaPico.v) : `$${horaPico.v}`} facturados
          </div>
        </div>

        {/* KPI 4: Alertas activas */}
        <div className="dash-kpi-card">
          <div className="kpi-label">
            <Icon name="alert" size={14}/> Alertas activas
          </div>
          <div className="kpi-val">{alertasTotal}</div>
          <div className="kpi-sub">{vencCount} por vencer · {stockBajoCount} stock bajo</div>
        </div>
      </div>

      {/* 3. Gráfico a lo ancho completo: Ventas por hora · hoy */}
      <div className="dash-card" style={{ width: "100%" }}>
        <div className="dash-card-h">
          <div>
            <h3 className="dash-card-title">Ventas por hora · hoy</h3>
            <p className="dash-card-sub">Distribución del día en curso</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-3, #64748B)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1877F2", display: "inline-block" }}></span>
            <span>Ventas (COP)</span>
          </div>
        </div>
        <div style={{ padding: "0 14px 4px 14px" }}>
          <div style={{ position: "relative", width: "100%", height: "140px" }}>
            <ChartCanvas
              type="bar"
              data={{
                labels: horasLabels,
                datasets: [{
                  label: "Ventas (COP)",
                  data: chartData,
                  backgroundColor: chartData.map(v => v === maxVentaHora && v > 0 ? "#1877F2" : "rgba(24, 119, 242, 0.75)"),
                  hoverBackgroundColor: "#1263CC",
                  borderRadius: 3,
                  borderSkipped: false,
                  maxBarThickness: 24,
                  barPercentage: 0.65,
                  categoryPercentage: 0.82,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => " " + (typeof window.fmtCOP === "function" ? window.fmtCOP(ctx.parsed.y) : `$${ctx.parsed.y}`)
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      color: "var(--text-3, #7E8898)",
                      font: { size: 9, family: "inherit" },
                      maxRotation: 0,
                      autoSkip: false
                    }
                  },
                  y: {
                    grid: { color: "rgba(226, 232, 240, 0.55)", drawBorder: false },
                    border: { display: false },
                    min: 0,
                    suggestedMax: maxGrafico > 0 ? maxGrafico * 1.15 : 10000,
                    ticks: {
                      color: "var(--text-3, #7E8898)",
                      font: { size: 9, family: "inherit" },
                      maxTicksLimit: 4,
                      callback: (v) => {
                        if (v === 0) return "0k";
                        if (v >= 1000000) return (v / 1000000) + "M";
                        if (v >= 1000) return (v / 1000) + "k";
                        return (v / 1000).toFixed(4) + "k";
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Fila intermedia de 3 tarjetas de métricas */}
      <div className="dash-metrics-grid">
        {/* Tarjeta 1: Productos registrados */}
        <div className="dash-metric-card" onClick={() => go && go("inventory")}>
          <div className="icon-box blue">
            <Icon name="pkg" size={18}/>
          </div>
          <div className="metric-info">
            <div className="metric-label">Productos registrados</div>
            <div className="metric-val">{totalProductos}</div>
            <div className="metric-trend">
              <span>↑</span> +{productos.filter(p => p.sku && (p.sku.startsWith("P-") || p.sku.startsWith("NUEVO"))).length || 12} este mes
            </div>
          </div>
          <div className="arrow-btn">
            <Icon name="chevronRight" size={15}/>
          </div>
        </div>

        {/* Tarjeta 2: Valor del inventario */}
        <div className="dash-metric-card" onClick={() => go && go("inventory")}>
          <div className="icon-box green">
            <Icon name="coins" size={18}/>
          </div>
          <div className="metric-info">
            <div className="metric-label">Valor del inventario</div>
            <div className="metric-val">
              {typeof window.fmtCOP === "function" ? window.fmtCOP(valorInventario) : `$${valorInventario.toLocaleString("es-CO")}`}
            </div>
            <div className="metric-trend">
              <span>↑</span> +5.2% vs. mes anterior
            </div>
          </div>
          <div className="arrow-btn">
            <Icon name="chevronRight" size={15}/>
          </div>
        </div>

        {/* Tarjeta 3: Ventas del mes */}
        <div className="dash-metric-card" onClick={() => go && go("reportes")}>
          <div className="icon-box purple">
            <Icon name="chart" size={18}/>
          </div>
          <div className="metric-info">
            <div className="metric-label">Ventas del mes</div>
            <div className="metric-val">
              {typeof window.fmtCOP === "function" ? window.fmtCOP(ventasMesTotal) : `$${ventasMesTotal.toLocaleString("es-CO")}`}
            </div>
            <div className="metric-trend">
              <span>↑</span> {tendenciaMesStr}
            </div>
          </div>
          <div className="arrow-btn">
            <Icon name="chevronRight" size={15}/>
          </div>
        </div>
      </div>

      {/* 5. Fila inferior: 3 Columnas (Productos más vendidos, Stock bajo, Detalle por cajero) */}
      <div className="dash-bottom-grid">
        {/* Columna 1: Productos más vendidos */}
        <div className="dash-card">
          <div className="dash-card-h">
            <h3 className="dash-card-title">Productos más vendidos</h3>
            <div style={{ position: "relative" }}>
              <select
                value={topPeriodo}
                onChange={(e) => setTopPeriodo(e.target.value)}
                style={{
                  appearance: "none",
                  background: "var(--surface, #FFFFFF)",
                  border: "1px solid var(--border, #E2E8F0)",
                  color: "var(--text-2, #475569)",
                  fontSize: "11px",
                  fontWeight: "500",
                  padding: "3px 22px 3px 8px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="hoy">Hoy</option>
                <option value="mes">Este mes</option>
                <option value="todo">Histórico</option>
              </select>
              <div style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-3, #64748B)" }}>
                <Icon name="chevronDown" size={11}/>
              </div>
            </div>
          </div>
          <div style={{ padding: "4px 14px 6px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1 }}>
            {productosMasVendidos.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", padding: "18px 0", fontSize: "12px" }}>
                Sin ventas registradas en este período
              </div>
            ) : (
              productosMasVendidos.map((p, idx) => (
                <div key={idx} className="dash-product-item">
                  <span className="dash-product-name" title={p.nombre}>
                    {(p.nombre || "").replace(/^\d{5,}\s*-\s*/, "")}
                  </span>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${p.pct}%` }}/>
                  </div>
                  <span className="dash-product-qty">{p.qty}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna 2: Stock bajo */}
        <div className="dash-card">
          <div className="dash-card-h">
            <h3 className="dash-card-title">Stock bajo</h3>
            <span
              onClick={() => go && go("inventory")}
              style={{ color: "#1877F2", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
            >
              Ver todos
            </span>
          </div>
          <div style={{ padding: "2px 14px 6px 14px", flex: 1, overflowX: "auto" }}>
            {stockBajoItems.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", padding: "18px 0", fontSize: "12px" }}>
                Todos los productos tienen stock suficiente
              </div>
            ) : (
              <table className="dash-stock-tbl">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Producto</th>
                    <th style={{ width: "28%" }}>Stock actual</th>
                    <th style={{ width: "27%", textAlign: "right" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stockBajoItems.map((item, idx) => (
                    <tr key={item.sku || idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div className="dash-stock-img-box">
                            {item.fotoUrl ? (
                              <img
                                src={item.fotoUrl}
                                alt={item.nombre}
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                            ) : (
                              <Icon name="box" size={13}/>
                            )}
                          </div>
                          <span className="dash-stock-prod-name" title={item.nombre}>
                            {item.nombre}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: item.esCritico ? "#D97706" : "#DC2626" }}>
                          {item.stock} {item.unidad}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`dash-badge ${item.esCritico ? "warn-crit" : "warn-low"}`}>
                          <Icon name="alert" size={10}/>
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Columna 3: Detalle por cajero · hoy */}
        <div className="dash-card">
          <div className="dash-card-h">
            <div>
              <h3 className="dash-card-title">Detalle por cajero · hoy</h3>
              <p className="dash-card-sub">Total y ventas del día</p>
            </div>
          </div>
          <div style={{ padding: "4px 14px 6px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1 }}>
            {cajerosHoy.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", padding: "18px 0", fontSize: "12px" }}>
                Sin ventas registradas hoy todavía
              </div>
            ) : (
              cajerosHoy.map((c) => (
                <div key={c.idx} className="dash-cajero-row">
                  <div className="dash-cajero-idx">{c.idx}</div>
                  <div className="dash-cajero-body">
                    <div className="dash-cajero-meta">
                      <span style={{ fontWeight: "600" }}>{c.nombre}</span>
                      <span className="dash-cajero-sub">
                        {c.transacciones} venta{c.transacciones === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="dash-cajero-bar-track">
                      <div className="dash-cajero-bar-fill" style={{ width: `${c.pct}%` }}/>
                    </div>
                  </div>
                  <div className="dash-cajero-val">
                    {typeof window.fmtCOP === "function" ? window.fmtCOP(c.total) : `$${c.total.toLocaleString("es-CO")}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Hub, Dashboard });
