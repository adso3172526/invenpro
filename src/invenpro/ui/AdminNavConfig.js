(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var NAV = [
    { id: "dashboard",   label: "Dashboard",            icon: "home",     color: "#3B82F6" },
    { id: "pos",         label: "Facturar",             icon: "cart",     color: "#0EA5E9" },
    { id: "inventory",   label: "Inventario",           icon: "box",      color: "#22C55E" },
    { id: "ingreso",     label: "Ingreso de mercancia", icon: "truck",    color: "#F59E0B" },
    { id: "vence",       label: "Vencimientos",         icon: "calendar", color: "#EF4444" },
    { id: "proveedores", label: "Provedores",           icon: "store",    color: "#A16207" },
    { id: "cajeros",     label: "Cajeros y turnos",     icon: "users",    color: "#9CA3AF" },
    { id: "reportes",    label: "Reporte de ventas",    icon: "chart",    color: "#8B5CF6" },
    { id: "ajustes",     label: "Configuracion",        icon: "settings", color: "#374151", rol: "Administrador" },
  ];
  var HUB_TILES = [
    { id: "dashboard",   label: "Dashboard",          desc: "Resumen y KPIs",                color: "#1E5BD9", soft: "#DCE7FB", icon: "chart" },
    { id: "inventory",   label: "Inventario",         desc: "Productos y stock",             color: "#0F766E", soft: "#CCFBF1", icon: "box" },
    { id: "ingreso",     label: "Ingreso mercancia",  desc: "Recepcion a bodega",            color: "#9333EA", soft: "#F3E8FF", icon: "truck" },
    { id: "vence",       label: "Vencimientos",       desc: "Alertas y umbrales",            color: "#EA580C", soft: "#FFEDD5", icon: "calendar" },
    { id: "proveedores", label: "Proveedores",        desc: "Directorio comercial",          color: "#0891B2", soft: "#CFFAFE", icon: "store" },
    { id: "cajeros",     label: "Cajeros y turnos",   desc: "Personal y aperturas",          color: "#DB2777", soft: "#FCE7F3", icon: "users" },
    { id: "reportes",    label: "Reporte de ventas",  desc: "Analisis filtrable",            color: "#CA8A04", soft: "#FEF3C7", icon: "chart" },
  ];
  root.AdminNavConfig = { NAV: NAV, HUB_TILES: HUB_TILES };
  window.NAV = NAV;
  window.HUB_TILES = HUB_TILES;
})();
