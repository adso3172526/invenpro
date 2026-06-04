// Datos simulados para InvenPro — Minimercado El Vecino
(function(){
  const today = new Date(2026, 4, 8); // 8 de mayo 2026
  const fmt = (d) => d.toISOString().slice(0,10);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

  const productos = [
    { sku: "7702001", nombre: "Leche entera 1L", categoria: "Lácteos", precio: 4500, costo: 3200, stock: 28, min: 10, vence: fmt(addDays(today, 6)), unidad: "und" },
    { sku: "7702002", nombre: "Yogurt natural 1L", categoria: "Lácteos", precio: 7900, costo: 5600, stock: 14, min: 8, vence: fmt(addDays(today, 11)), unidad: "und" },
    { sku: "7702003", nombre: "Queso campesino 250g", categoria: "Lácteos", precio: 8500, costo: 6100, stock: 7, min: 6, vence: fmt(addDays(today, 4)), unidad: "und" },
    { sku: "7702004", nombre: "Mantequilla 250g", categoria: "Lácteos", precio: 6700, costo: 4800, stock: 22, min: 6, vence: fmt(addDays(today, 60)), unidad: "und" },
    { sku: "7710101", nombre: "Pan tajado integral", categoria: "Panadería", precio: 6800, costo: 4500, stock: 9, min: 5, vence: fmt(addDays(today, 5)), unidad: "und" },
    { sku: "7710102", nombre: "Galletas saladas x6", categoria: "Panadería", precio: 4200, costo: 2900, stock: 40, min: 10, vence: fmt(addDays(today, 95)), unidad: "und" },
    { sku: "7720001", nombre: "Arroz blanco 1kg", categoria: "Granos", precio: 5200, costo: 3700, stock: 64, min: 20, vence: fmt(addDays(today, 240)), unidad: "und" },
    { sku: "7720002", nombre: "Frijol rojo 500g", categoria: "Granos", precio: 6800, costo: 4900, stock: 30, min: 12, vence: fmt(addDays(today, 200)), unidad: "und" },
    { sku: "7720003", nombre: "Lenteja 500g", categoria: "Granos", precio: 5400, costo: 3900, stock: 4, min: 10, vence: fmt(addDays(today, 180)), unidad: "und" },
    { sku: "7720004", nombre: "Pasta espagueti 500g", categoria: "Granos", precio: 4100, costo: 2800, stock: 52, min: 15, vence: fmt(addDays(today, 300)), unidad: "und" },
    { sku: "7730001", nombre: "Aceite girasol 1L", categoria: "Despensa", precio: 14500, costo: 11000, stock: 18, min: 8, vence: fmt(addDays(today, 150)), unidad: "und" },
    { sku: "7730002", nombre: "Azúcar blanca 1kg", categoria: "Despensa", precio: 5800, costo: 4200, stock: 33, min: 10, vence: fmt(addDays(today, 220)), unidad: "und" },
    { sku: "7730003", nombre: "Sal refinada 1kg", categoria: "Despensa", precio: 2800, costo: 1700, stock: 55, min: 10, vence: fmt(addDays(today, 720)), unidad: "und" },
    { sku: "7730004", nombre: "Café molido 250g", categoria: "Despensa", precio: 13900, costo: 9800, stock: 16, min: 6, vence: fmt(addDays(today, 18)), unidad: "und" },
    { sku: "7730005", nombre: "Chocolate de mesa 500g", categoria: "Despensa", precio: 9700, costo: 7200, stock: 11, min: 5, vence: fmt(addDays(today, 80)), unidad: "und" },
    { sku: "7740001", nombre: "Atún en lata 170g", categoria: "Enlatados", precio: 8900, costo: 6500, stock: 38, min: 12, vence: fmt(addDays(today, 400)), unidad: "und" },
    { sku: "7740002", nombre: "Sardinas en aceite 425g", categoria: "Enlatados", precio: 11500, costo: 8400, stock: 19, min: 8, vence: fmt(addDays(today, 380)), unidad: "und" },
    { sku: "7740003", nombre: "Salsa de tomate 200g", categoria: "Enlatados", precio: 4900, costo: 3300, stock: 26, min: 10, vence: fmt(addDays(today, 240)), unidad: "und" },
    { sku: "7750001", nombre: "Bebida gaseosa cola 1.5L", categoria: "Bebidas", precio: 6500, costo: 4400, stock: 46, min: 15, vence: fmt(addDays(today, 90)), unidad: "und" },
    { sku: "7750002", nombre: "Agua mineral 1.5L", categoria: "Bebidas", precio: 3500, costo: 2100, stock: 60, min: 20, vence: fmt(addDays(today, 360)), unidad: "und" },
    { sku: "7750003", nombre: "Jugo naranja 1L", categoria: "Bebidas", precio: 5900, costo: 4100, stock: 8, min: 10, vence: fmt(addDays(today, 9)), unidad: "und" },
    { sku: "7750004", nombre: "Cerveza lager 330ml", categoria: "Bebidas", precio: 4300, costo: 2900, stock: 72, min: 24, vence: fmt(addDays(today, 120)), unidad: "und" },
    { sku: "7760001", nombre: "Huevos AA x12", categoria: "Frescos", precio: 13800, costo: 10500, stock: 17, min: 8, vence: fmt(addDays(today, 21)), unidad: "und" },
    { sku: "7760002", nombre: "Banano (kg)", categoria: "Frescos", precio: 3200, costo: 1900, stock: 35, min: 10, vence: fmt(addDays(today, 5)), unidad: "kg" },
    { sku: "7760003", nombre: "Tomate chonto (kg)", categoria: "Frescos", precio: 4900, costo: 3000, stock: 22, min: 8, vence: fmt(addDays(today, 6)), unidad: "kg" },
    { sku: "7760004", nombre: "Cebolla cabezona (kg)", categoria: "Frescos", precio: 3800, costo: 2200, stock: 28, min: 8, vence: fmt(addDays(today, 14)), unidad: "kg" },
    { sku: "7770001", nombre: "Papel higiénico x4", categoria: "Aseo", precio: 8900, costo: 6300, stock: 24, min: 8, vence: null, unidad: "und" },
    { sku: "7770002", nombre: "Jabón de baño 110g", categoria: "Aseo", precio: 4400, costo: 3000, stock: 41, min: 12, vence: null, unidad: "und" },
    { sku: "7770003", nombre: "Detergente polvo 500g", categoria: "Aseo", precio: 9900, costo: 7100, stock: 5, min: 8, vence: null, unidad: "und" },
    { sku: "7770004", nombre: "Crema dental 75ml", categoria: "Aseo", precio: 7600, costo: 5500, stock: 27, min: 8, vence: fmt(addDays(today, 540)), unidad: "und" },
  ];

  const cajeros = [
    { id: "C-01", nombre: "Jeferson Ortiz", doc: "1.085.402.118", rol: "Cajero", estado: "activo", turnoActivo: true, ingreso: "2024-03-12", ventas30d: 18420000 },
    { id: "C-02", nombre: "Alejandro Vargas", doc: "1.020.998.217", rol: "Cajero", estado: "activo", turnoActivo: true, ingreso: "2024-08-04", ventas30d: 14890000 },
    { id: "C-03", nombre: "Jesica Sánchez", doc: "1.144.221.300", rol: "Cajero", estado: "activo", turnoActivo: false, ingreso: "2025-01-22", ventas30d: 11340000 },
  ];

  // Generar ventas simuladas de los últimos 6 meses
  const meses = ["Dic 25","Ene 26","Feb 26","Mar 26","Abr 26","May 26"];
  const ventasMes = [
    { mes: "Dic 25", total: 47820000, transacciones: 1284 },
    { mes: "Ene 26", total: 39410000, transacciones: 1142 },
    { mes: "Feb 26", total: 41250000, transacciones: 1196 },
    { mes: "Mar 26", total: 44980000, transacciones: 1308 },
    { mes: "Abr 26", total: 48330000, transacciones: 1412 },
    { mes: "May 26", total: 12180000, transacciones: 358 },
  ];

  // Ventas por cajero (mes actual)
  const ventasCajero = [
    { id: "C-01", nombre: "Jeferson Ortiz", total: 3920000, ticket: 19800, trans: 198 },
    { id: "C-02", nombre: "Alejandro Vargas", total: 2510000, ticket: 18200, trans: 138 },
    { id: "C-03", nombre: "Jesica Sánchez", total: 1370000, ticket: 16500, trans: 83 },
  ];

  // Top productos (mes actual)
  const topProductos = [
    { sku: "7720001", nombre: "Arroz blanco 1kg", unid: 412, total: 2142400 },
    { sku: "7710101", nombre: "Pan tajado integral", unid: 388, total: 2638400 },
    { sku: "7702001", nombre: "Leche entera 1L", unid: 356, total: 1602000 },
    { sku: "7750001", nombre: "Bebida gaseosa cola 1.5L", unid: 280, total: 1820000 },
    { sku: "7760001", nombre: "Huevos AA x12", unid: 142, total: 1959600 },
    { sku: "7730001", nombre: "Aceite girasol 1L", unid: 96, total: 1392000 },
    { sku: "7770001", nombre: "Papel higiénico x4", unid: 88, total: 783200 },
    { sku: "7750002", nombre: "Agua mineral 1.5L", unid: 210, total: 735000 },
  ];

  // Movimientos recientes de inventario (ingresos)
  const ingresos = [
    { id: "ING-1042", fecha: "2026-05-07", proveedor: "Distribuidora El Sol", items: 8, costo: 1820000, recibe: "Administrador", factura: "FV-3421", detalle: [
      { sku: "ARR-1KG", nombre: "Arroz Diana 1kg", qty: 80, costo: 4200, vence: "2027-05-01" },
      { sku: "ACE-900", nombre: "Aceite Premier 900ml", qty: 60, costo: 9800, vence: "2027-02-15" },
      { sku: "AZU-1KG", nombre: "Azúcar Manuelita 1kg", qty: 100, costo: 3800, vence: "2027-08-20" },
      { sku: "PAS-250", nombre: "Pasta Doria 250g", qty: 120, costo: 2200, vence: "2027-03-10" },
      { sku: "FRI-500", nombre: "Frijol Cabecita Negra 500g", qty: 50, costo: 5400, vence: "2027-01-22" },
      { sku: "LEN-500", nombre: "Lenteja 500g", qty: 50, costo: 4900, vence: "2027-04-12" },
      { sku: "SAL-1KG", nombre: "Sal Refisal 1kg", qty: 80, costo: 2100, vence: null },
      { sku: "CAF-500", nombre: "Café Sello Rojo 500g", qty: 40, costo: 14500, vence: "2027-06-18" },
    ]},
    { id: "ING-1041", fecha: "2026-05-05", proveedor: "Lácteos del Valle", items: 4, costo: 740000, recibe: "Administrador", factura: "LV-8821", detalle: [
      { sku: "LEC-1L", nombre: "Leche Alquería 1L", qty: 120, costo: 4100, vence: "2026-06-10" },
      { sku: "QUE-500", nombre: "Queso Campesino 500g", qty: 35, costo: 9800, vence: "2026-05-25" },
      { sku: "YOG-1L", nombre: "Yogurt Alpina 1L", qty: 50, costo: 5500, vence: "2026-06-05" },
      { sku: "MAN-250", nombre: "Mantequilla 250g", qty: 25, costo: 4200, vence: "2026-07-12" },
    ]},
    { id: "ING-1040", fecha: "2026-05-03", proveedor: "Frutiverduras Mayor", items: 6, costo: 510000, recibe: "Administrador", factura: "FM-5512", detalle: [
      { sku: "TOM-KG", nombre: "Tomate chonto kg", qty: 60, costo: 3500, vence: "2026-05-15" },
      { sku: "CEB-KG", nombre: "Cebolla cabezona kg", qty: 50, costo: 3200, vence: "2026-05-20" },
      { sku: "PAP-KG", nombre: "Papa pastusa kg", qty: 80, costo: 2400, vence: "2026-05-25" },
      { sku: "BAN-KG", nombre: "Banano kg", qty: 70, costo: 2800, vence: "2026-05-12" },
      { sku: "AGU-UND", nombre: "Aguacate und", qty: 40, costo: 3800, vence: "2026-05-13" },
      { sku: "LIM-KG", nombre: "Limón Tahití kg", qty: 30, costo: 4500, vence: "2026-05-18" },
    ]},
    { id: "ING-1039", fecha: "2026-04-30", proveedor: "Distribuidora El Sol", items: 12, costo: 2350000, recibe: "Administrador", factura: "FV-3380", detalle: [
      { sku: "ARR-1KG", nombre: "Arroz Diana 1kg", qty: 100, costo: 4200, vence: "2027-04-25" },
      { sku: "ACE-900", nombre: "Aceite Premier 900ml", qty: 80, costo: 9800, vence: "2027-01-30" },
      { sku: "PAN-500", nombre: "Pan tajado Bimbo 500g", qty: 50, costo: 6800, vence: "2026-05-15" },
      { sku: "GAL-300", nombre: "Galletas Saltinas 300g", qty: 90, costo: 4200, vence: "2027-02-20" },
      { sku: "CHO-500", nombre: "Chocolate Corona 500g", qty: 45, costo: 8200, vence: "2027-03-15" },
      { sku: "ATU-180", nombre: "Atún Van Camps 180g", qty: 110, costo: 5800, vence: "2028-04-25" },
      { sku: "MAY-400", nombre: "Mayonesa Fruco 400g", qty: 60, costo: 6500, vence: "2027-04-10" },
      { sku: "SAL-TOM", nombre: "Salsa de tomate 200g", qty: 80, costo: 3400, vence: "2027-05-20" },
      { sku: "MOS-200", nombre: "Mostaza 200g", qty: 35, costo: 3200, vence: "2027-04-15" },
      { sku: "VIN-500", nombre: "Vinagre 500ml", qty: 40, costo: 2800, vence: "2027-08-10" },
      { sku: "CON-100", nombre: "Consomé Maggi 100g", qty: 60, costo: 4800, vence: "2027-03-22" },
      { sku: "NES-150", nombre: "Nescafé 150g", qty: 50, costo: 17500, vence: "2027-05-15" },
    ]},
    { id: "ING-1038", fecha: "2026-04-28", proveedor: "Aseo y Hogar S.A.S", items: 5, costo: 680000, recibe: "Administrador", factura: "AH-2241", detalle: [
      { sku: "DET-1KG", nombre: "Detergente Fab 1kg", qty: 40, costo: 7800, vence: null },
      { sku: "JAB-3UN", nombre: "Jabón Rey x3", qty: 60, costo: 4500, vence: null },
      { sku: "PAP-12", nombre: "Papel higiénico x12", qty: 30, costo: 18500, vence: null },
      { sku: "SUA-1L", nombre: "Suavizante 1L", qty: 25, costo: 8200, vence: null },
      { sku: "CRE-100", nombre: "Crema dental 100ml", qty: 50, costo: 4800, vence: "2028-04-10" },
    ]},
  ];

  // Proveedores
  const proveedores = [
    { id: "PRV-001", nombre: "Distribuidora El Sol", nit: "900.124.567-8", contacto: "Mauricio Rendón", tel: "(4) 444 1820", email: "ventas@elsol.co", ciudad: "Medellín", categoria: "Abarrotes", terminos: "30 días", estado: "activo", ingresos: 24, ultimoIngreso: "2026-05-07" },
    { id: "PRV-002", nombre: "Lácteos del Valle", nit: "830.998.221-2", contacto: "Carolina Bedoya", tel: "(2) 660 1245", email: "pedidos@lacteosvalle.com", ciudad: "Cali", categoria: "Lácteos", terminos: "15 días", estado: "activo", ingresos: 18, ultimoIngreso: "2026-05-05" },
    { id: "PRV-003", nombre: "Frutiverduras Mayor", nit: "901.220.114-3", contacto: "Hugo Patiño", tel: "(1) 320 7711", email: "hugo@frutiverduras.co", ciudad: "Bogotá", categoria: "Frutas y verduras", terminos: "Contado", estado: "activo", ingresos: 31, ultimoIngreso: "2026-05-03" },
    { id: "PRV-004", nombre: "Aseo y Hogar S.A.S", nit: "900.778.412-1", contacto: "Liliana Quintero", tel: "(4) 511 8900", email: "comercial@aseohogar.co", ciudad: "Itagüí", categoria: "Aseo", terminos: "30 días", estado: "activo", ingresos: 12, ultimoIngreso: "2026-04-28" },
    { id: "PRV-005", nombre: "Bebidas Andinas Ltda", nit: "830.412.009-5", contacto: "Esteban Mora", tel: "(1) 411 0022", email: "ventas@bebidasandinas.co", ciudad: "Bogotá", categoria: "Bebidas", terminos: "45 días", estado: "inactivo", ingresos: 6, ultimoIngreso: "2026-02-14" },
    { id: "PRV-006", nombre: "Panadería La Esquina", nit: "16.213.882-4", contacto: "Doña Marta Rojas", tel: "(4) 234 7710", email: "panaderialaesquina@gmail.com", ciudad: "Envigado", categoria: "Panadería", terminos: "Contado", estado: "activo", ingresos: 64, ultimoIngreso: "2026-05-08" },
  ];

  // Turnos recientes
  const turnos = [
    { id: "T-2031", cajero: "Jeferson Ortiz", fechaIni: "2026-05-08 06:55", fechaFin: null, baseIni: 200000, ventas: 1240000, transacciones: 38, estado: "abierto" },
    { id: "T-2030", cajero: "Alejandro Vargas", fechaIni: "2026-05-08 06:50", fechaFin: null, baseIni: 200000, ventas: 980000, transacciones: 29, estado: "abierto" },
    { id: "T-2029", cajero: "Alejandro Vargas", fechaIni: "2026-05-07 14:00", fechaFin: "2026-05-07 21:10", baseIni: 200000, ventas: 1820000, transacciones: 71, estado: "cerrado" },
    { id: "T-2028", cajero: "Jeferson Ortiz", fechaIni: "2026-05-07 06:50", fechaFin: "2026-05-07 13:55", baseIni: 200000, ventas: 1690000, transacciones: 64, estado: "cerrado" },
    { id: "T-2027", cajero: "Jesica Sánchez", fechaIni: "2026-05-07 06:40", fechaFin: "2026-05-07 13:50", baseIni: 200000, ventas: 2050000, transacciones: 78, estado: "cerrado" },
    { id: "T-2026", cajero: "Jesica Sánchez", fechaIni: "2026-05-06 14:00", fechaFin: "2026-05-06 21:05", baseIni: 200000, ventas: 1310000, transacciones: 52, estado: "cerrado" },
  ];

  // Ventas detalladas (para el reporte filtrable)
  const facturas = [];
  const cajerosNom = ["Jeferson Ortiz","Alejandro Vargas","Jesica Sánchez"];
  const metodos = ["Efectivo","Transferencia","Nequi","Daviplata"];
  let seed = 42;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed/233280; }
  for (let i = 0; i < 60; i++) {
    const dayOffset = -Math.floor(rnd() * 60);
    const date = addDays(today, dayOffset);
    const lineas = 1 + Math.floor(rnd()*5);
    const items = [];
    let total = 0;
    for (let l = 0; l < lineas; l++) {
      const p = productos[Math.floor(rnd()*productos.length)];
      const q = 1 + Math.floor(rnd()*3);
      items.push({ sku: p.sku, nombre: p.nombre, q, precio: p.precio });
      total += q * p.precio;
    }
    facturas.push({
      id: "F-" + (10250 + i),
      fecha: fmt(date),
      hora: `${String(7+Math.floor(rnd()*13)).padStart(2,'0')}:${String(Math.floor(rnd()*60)).padStart(2,'0')}`,
      cajero: cajerosNom[Math.floor(rnd()*cajerosNom.length)],
      metodo: metodos[Math.floor(rnd()*metodos.length)],
      items,
      total,
    });
  }
  facturas.sort((a,b) => (b.fecha+b.hora).localeCompare(a.fecha+a.hora));

  // Ventas día actual hora por hora (sparkline)
  const ventasHoy = [
    { h: "07", v: 145000 },
    { h: "08", v: 280000 },
    { h: "09", v: 340000 },
    { h: "10", v: 410000 },
    { h: "11", v: 520000 },
    { h: "12", v: 690000 },
    { h: "13", v: 480000 },
  ];

  window.MOCK = {
    today,
    productos,
    cajeros,
    usuarios_sistema: [
      // Credenciales y rol determinado por la tabla de permisos
      { usuario: "admin",            pass: "admin123",      nombre: "Administrador InvenPro", rol: "Administrador",
        permisos: ["POS_FACTURAR","TURNO_ABRIR_CERRAR","INVENTARIO_VER","INVENTARIO_EDITAR","INGRESO_CREAR","PROVEEDOR_GESTIONAR","ALERTA_CONFIGURAR","USUARIO_GESTIONAR","REPORTE_VER"] },
      { usuario: "supervisor",       pass: "super123",      nombre: "Carla Méndez",           rol: "Supervisor",
        permisos: ["POS_FACTURAR","TURNO_ABRIR_CERRAR","INVENTARIO_VER","REPORTE_VER","INGRESO_CREAR"] },
      { usuario: "jeferson.ortiz",   pass: "cajero123",     nombre: "Jeferson Ortiz",         rol: "Cajero",
        permisos: ["POS_FACTURAR","TURNO_ABRIR_CERRAR","INVENTARIO_VER"] },
      { usuario: "alejandro.vargas", pass: "cajero123",     nombre: "Alejandro Vargas",       rol: "Cajero",
        permisos: ["POS_FACTURAR","TURNO_ABRIR_CERRAR","INVENTARIO_VER"] },
      { usuario: "jesica.sanchez",   pass: "cajero123",     nombre: "Jesica Sánchez",         rol: "Cajero",
        permisos: ["POS_FACTURAR","TURNO_ABRIR_CERRAR","INVENTARIO_VER"] },
    ],
    ventasMes,
    ventasCajero,
    topProductos,
    ingresos,
    proveedores,
    turnos,
    facturas,
    ventasHoy,
  };
  window.fmtCOP = function(n) {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n).toLocaleString("es-CO");
  };
  window.daysFromNow = function(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const ms = d - today;
    return Math.round(ms / (1000*60*60*24));
  };
  window.todayStr = fmt(today);
})();
