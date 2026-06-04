-- =============================================================
-- InvenPro – Seed Data
-- Generated for base date: 2026-05-08
-- =============================================================

-- -------------------------------------------------------------
-- 1. PRODUCTOS (30 rows)
-- -------------------------------------------------------------
INSERT INTO productos (sku, nombre, categoria, precio, costo, stock, min, vence, unidad) VALUES
('7702001', 'Leche entera 1L',          'Lácteos',    4500,  3200, 28, 10, '2026-05-14', 'und'),
('7702002', 'Yogurt natural 1L',        'Lácteos',    7900,  5600, 14,  8, '2026-05-19', 'und'),
('7702003', 'Queso campesino 250g',     'Lácteos',    8500,  6100,  7,  6, '2026-05-12', 'und'),
('7702004', 'Mantequilla 250g',         'Lácteos',    6700,  4800, 22,  6, '2026-07-07', 'und'),
('7710101', 'Pan tajado integral',      'Panadería',  6800,  4500,  9,  5, '2026-05-13', 'und'),
('7710102', 'Galletas saladas x6',      'Panadería',  4200,  2900, 40, 10, '2026-08-11', 'und'),
('7720001', 'Arroz blanco 1kg',         'Granos',     5200,  3700, 64, 20, '2027-01-03', 'und'),
('7720002', 'Frijol rojo 500g',         'Granos',     6800,  4900, 30, 12, '2026-11-24', 'und'),
('7720003', 'Lenteja 500g',             'Granos',     5400,  3900,  4, 10, '2026-11-04', 'und'),
('7720004', 'Pasta espagueti 500g',     'Granos',     4100,  2800, 52, 15, '2027-03-04', 'und'),
('7730001', 'Aceite girasol 1L',        'Despensa',  14500, 11000, 18,  8, '2026-10-05', 'und'),
('7730002', 'Azúcar blanca 1kg',        'Despensa',   5800,  4200, 33, 10, '2026-12-14', 'und'),
('7730003', 'Sal refinada 1kg',         'Despensa',   2800,  1700, 55, 10, '2028-04-28', 'und'),
('7730004', 'Café molido 250g',         'Despensa',  13900,  9800, 16,  6, '2026-05-26', 'und'),
('7730005', 'Chocolate de mesa 500g',   'Despensa',   9700,  7200, 11,  5, '2026-07-27', 'und'),
('7740001', 'Atún en lata 170g',        'Enlatados',  8900,  6500, 38, 12, '2027-06-12', 'und'),
('7740002', 'Sardinas en aceite 425g',  'Enlatados', 11500,  8400, 19,  8, '2027-05-23', 'und'),
('7740003', 'Salsa de tomate 200g',     'Enlatados',  4900,  3300, 26, 10, '2027-01-03', 'und'),
('7750001', 'Bebida gaseosa cola 1.5L', 'Bebidas',    6500,  4400, 46, 15, '2026-08-06', 'und'),
('7750002', 'Agua mineral 1.5L',        'Bebidas',    3500,  2100, 60, 20, '2027-05-03', 'und'),
('7750003', 'Jugo naranja 1L',          'Bebidas',    5900,  4100,  8, 10, '2026-05-17', 'und'),
('7750004', 'Cerveza lager 330ml',      'Bebidas',    4300,  2900, 72, 24, '2026-09-05', 'und'),
('7760001', 'Huevos AA x12',            'Frescos',   13800, 10500, 17,  8, '2026-05-29', 'und'),
('7760002', 'Banano (kg)',              'Frescos',    3200,  1900, 35, 10, '2026-05-13', 'kg'),
('7760003', 'Tomate chonto (kg)',       'Frescos',    4900,  3000, 22,  8, '2026-05-14', 'kg'),
('7760004', 'Cebolla cabezona (kg)',    'Frescos',    3800,  2200, 28,  8, '2026-05-22', 'kg'),
('7770001', 'Papel higiénico x4',       'Aseo',       8900,  6300, 24,  8, NULL, 'und'),
('7770002', 'Jabón de baño 110g',       'Aseo',       4400,  3000, 41, 12, NULL, 'und'),
('7770003', 'Detergente polvo 500g',    'Aseo',       9900,  7100,  5,  8, NULL, 'und'),
('7770004', 'Crema dental 75ml',        'Aseo',       7600,  5500, 27,  8, '2027-10-30', 'und');

-- -------------------------------------------------------------
-- 2. USUARIOS DEL SISTEMA (5 rows)
-- -------------------------------------------------------------
INSERT INTO usuarios_sistema (usuario, pass, nombre, rol, permisos) VALUES
('admin',            'admin123',  'Administrador InvenPro', 'Administrador',
  ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER','INVENTARIO_EDITAR','INGRESO_CREAR','PROVEEDOR_GESTIONAR','ALERTA_CONFIGURAR','USUARIO_GESTIONAR','REPORTE_VER']),
('supervisor',       'super123',  'Carla Méndez',           'Supervisor',
  ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER','REPORTE_VER','INGRESO_CREAR']),
('jeferson.ortiz',   'cajero123', 'Jeferson Ortiz',         'Cajero',
  ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER']),
('alejandro.vargas', 'cajero123', 'Alejandro Vargas',       'Cajero',
  ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER']),
('jesica.sanchez',   'cajero123', 'Jesica Sánchez',         'Cajero',
  ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER']);

-- -------------------------------------------------------------
-- 3. CAJEROS (3 rows)
-- -------------------------------------------------------------
INSERT INTO cajeros (id, nombre, doc, rol, estado, turno_activo, ingreso, ventas_30d) VALUES
('C-01', 'Jeferson Ortiz',   '1.085.402.118', 'Cajero', 'activo', true,  '2024-03-12', 18420000),
('C-02', 'Alejandro Vargas', '1.020.998.217', 'Cajero', 'activo', true,  '2024-08-04', 14890000),
('C-03', 'Jesica Sánchez',   '1.144.221.300', 'Cajero', 'activo', false, '2025-01-22', 11340000);

-- -------------------------------------------------------------
-- 4. PROVEEDORES (6 rows)
-- -------------------------------------------------------------
INSERT INTO proveedores (id, nombre, nit, contacto, tel, email, ciudad, categoria, terminos, estado, ingresos, ultimo_ingreso) VALUES
('PRV-001', 'Distribuidora El Sol',  '900.124.567-8',  'Mauricio Rendón',  '(4) 444 1820', 'ventas@elsol.co',                'Medellín', 'Abarrotes',          '30 días', 'activo',   24, '2026-05-07'),
('PRV-002', 'Lácteos del Valle',     '830.998.221-2',  'Carolina Bedoya',  '(2) 660 1245', 'pedidos@lacteosvalle.com',       'Cali',     'Lácteos',            '15 días', 'activo',   18, '2026-05-05'),
('PRV-003', 'Frutiverduras Mayor',   '901.220.114-3',  'Hugo Patiño',      '(1) 320 7711', 'hugo@frutiverduras.co',          'Bogotá',   'Frutas y verduras',  'Contado', 'activo',   31, '2026-05-03'),
('PRV-004', 'Aseo y Hogar S.A.S',    '900.778.412-1',  'Liliana Quintero', '(4) 511 8900', 'comercial@aseohogar.co',         'Itagüí',   'Aseo',               '30 días', 'activo',   12, '2026-04-28'),
('PRV-005', 'Bebidas Andinas Ltda',  '830.412.009-5',  'Esteban Mora',     '(1) 411 0022', 'ventas@bebidasandinas.co',       'Bogotá',   'Bebidas',            '45 días', 'inactivo',  6, '2026-02-14'),
('PRV-006', 'Panadería La Esquina',  '16.213.882-4',   'Doña Marta Rojas', '(4) 234 7710', 'panaderialaesquina@gmail.com',   'Envigado', 'Panadería',          'Contado', 'activo',   64, '2026-05-08');

-- -------------------------------------------------------------
-- 5. TURNOS (6 rows)
-- -------------------------------------------------------------
INSERT INTO turnos (id, cajero, fecha_ini, fecha_fin, base_ini, ventas, transacciones, estado) VALUES
('T-2031', 'Jeferson Ortiz',   '2026-05-08 06:55', NULL,                200000, 1240000, 38, 'abierto'),
('T-2030', 'Alejandro Vargas', '2026-05-08 06:50', NULL,                200000,  980000, 29, 'abierto'),
('T-2029', 'Alejandro Vargas', '2026-05-07 14:00', '2026-05-07 21:10', 200000, 1820000, 71, 'cerrado'),
('T-2028', 'Jeferson Ortiz',   '2026-05-07 06:50', '2026-05-07 13:55', 200000, 1690000, 64, 'cerrado'),
('T-2027', 'Jesica Sánchez',   '2026-05-07 06:40', '2026-05-07 13:50', 200000, 2050000, 78, 'cerrado'),
('T-2026', 'Jesica Sánchez',   '2026-05-06 14:00', '2026-05-06 21:05', 200000, 1310000, 52, 'cerrado');

-- -------------------------------------------------------------
-- 6. INGRESOS (5 rows)
-- -------------------------------------------------------------
INSERT INTO ingresos (id, fecha, proveedor, items, costo, recibe, factura) VALUES
('ING-1042', '2026-05-07', 'Distribuidora El Sol',  8, 1820000, 'Administrador', 'FV-3421'),
('ING-1041', '2026-05-05', 'Lácteos del Valle',     4,  740000, 'Administrador', 'LV-8821'),
('ING-1040', '2026-05-03', 'Frutiverduras Mayor',   6,  510000, 'Administrador', 'FM-5512'),
('ING-1039', '2026-04-30', 'Distribuidora El Sol', 12, 2350000, 'Administrador', 'FV-3380'),
('ING-1038', '2026-04-28', 'Aseo y Hogar S.A.S',    5,  680000, 'Administrador', 'AH-2241');

-- -------------------------------------------------------------
-- 7. INGRESO DETALLE (35 rows)
-- -------------------------------------------------------------

-- ING-1042: Distribuidora El Sol (8 items)
INSERT INTO ingreso_detalle (ingreso_id, sku, nombre, qty, costo, vence) VALUES
('ING-1042', 'ARR-1KG',  'Arroz Diana 1kg',              80,  4200, '2027-05-01'),
('ING-1042', 'ACE-900',  'Aceite Premier 900ml',          60,  9800, '2027-02-15'),
('ING-1042', 'AZU-1KG',  'Azúcar Manuelita 1kg',         100,  3800, '2027-08-20'),
('ING-1042', 'PAS-250',  'Pasta Doria 250g',              120,  2200, '2027-03-10'),
('ING-1042', 'FRI-500',  'Frijol Cabecita Negra 500g',    50,  5400, '2027-01-22'),
('ING-1042', 'LEN-500',  'Lenteja 500g',                  50,  4900, '2027-04-12'),
('ING-1042', 'SAL-1KG',  'Sal Refisal 1kg',               80,  2100, NULL),
('ING-1042', 'CAF-500',  'Café Sello Rojo 500g',          40, 14500, '2027-06-18');

-- ING-1041: Lácteos del Valle (4 items)
INSERT INTO ingreso_detalle (ingreso_id, sku, nombre, qty, costo, vence) VALUES
('ING-1041', 'LEC-1L',   'Leche Alquería 1L',            120,  4100, '2026-06-10'),
('ING-1041', 'QUE-500',  'Queso Campesino 500g',          35,  9800, '2026-05-25'),
('ING-1041', 'YOG-1L',   'Yogurt Alpina 1L',              50,  5500, '2026-06-05'),
('ING-1041', 'MAN-250',  'Mantequilla 250g',              25,  4200, '2026-07-12');

-- ING-1040: Frutiverduras Mayor (6 items)
INSERT INTO ingreso_detalle (ingreso_id, sku, nombre, qty, costo, vence) VALUES
('ING-1040', 'TOM-KG',   'Tomate chonto kg',              60,  3500, '2026-05-15'),
('ING-1040', 'CEB-KG',   'Cebolla cabezona kg',           50,  3200, '2026-05-20'),
('ING-1040', 'PAP-KG',   'Papa pastusa kg',               80,  2400, '2026-05-25'),
('ING-1040', 'BAN-KG',   'Banano kg',                     70,  2800, '2026-05-12'),
('ING-1040', 'AGU-UND',  'Aguacate und',                  40,  3800, '2026-05-13'),
('ING-1040', 'LIM-KG',   'Limón Tahití kg',               30,  4500, '2026-05-18');

-- ING-1039: Distribuidora El Sol (12 items)
INSERT INTO ingreso_detalle (ingreso_id, sku, nombre, qty, costo, vence) VALUES
('ING-1039', 'ARR-1KG',  'Arroz Diana 1kg',              100,  4200, '2027-04-25'),
('ING-1039', 'ACE-900',  'Aceite Premier 900ml',          80,  9800, '2027-01-30'),
('ING-1039', 'PAN-500',  'Pan tajado Bimbo 500g',         50,  6800, '2026-05-15'),
('ING-1039', 'GAL-300',  'Galletas Saltinas 300g',        90,  4200, '2027-02-20'),
('ING-1039', 'CHO-500',  'Chocolate Corona 500g',         45,  8200, '2027-03-15'),
('ING-1039', 'ATU-180',  'Atún Van Camps 180g',          110,  5800, '2028-04-25'),
('ING-1039', 'MAY-400',  'Mayonesa Fruco 400g',           60,  6500, '2027-04-10'),
('ING-1039', 'SAL-TOM',  'Salsa de tomate 200g',          80,  3400, '2027-05-20'),
('ING-1039', 'MOS-200',  'Mostaza 200g',                  35,  3200, '2027-04-15'),
('ING-1039', 'VIN-500',  'Vinagre 500ml',                 40,  2800, '2027-08-10'),
('ING-1039', 'CON-100',  'Consomé Maggi 100g',            60,  4800, '2027-03-22'),
('ING-1039', 'NES-150',  'Nescafé 150g',                  50, 17500, '2027-05-15');

-- ING-1038: Aseo y Hogar S.A.S (5 items)
INSERT INTO ingreso_detalle (ingreso_id, sku, nombre, qty, costo, vence) VALUES
('ING-1038', 'DET-1KG',  'Detergente Fab 1kg',            40,  7800, NULL),
('ING-1038', 'JAB-3UN',  'Jabón Rey x3',                  60,  4500, NULL),
('ING-1038', 'PAP-12',   'Papel higiénico x12',           30, 18500, NULL),
('ING-1038', 'SUA-1L',   'Suavizante 1L',                 25,  8200, NULL),
('ING-1038', 'CRE-100',  'Crema dental 100ml',            50,  4800, '2028-04-10');

-- -------------------------------------------------------------
-- 8. DASHBOARD – VENTAS POR MES (6 rows)
-- -------------------------------------------------------------
INSERT INTO ventas_mes (mes, total, transacciones) VALUES
('Dic 25', 47820000, 1284),
('Ene 26', 39410000, 1142),
('Feb 26', 41250000, 1196),
('Mar 26', 44980000, 1308),
('Abr 26', 48330000, 1412),
('May 26', 12180000,  358);

-- -------------------------------------------------------------
-- 9. DASHBOARD – VENTAS POR CAJERO (3 rows)
-- -------------------------------------------------------------
INSERT INTO ventas_cajero (id, nombre, total, ticket, trans) VALUES
('C-01', 'Jeferson Ortiz',   3920000, 19800, 198),
('C-02', 'Alejandro Vargas', 2510000, 18200, 138),
('C-03', 'Jesica Sánchez',   1370000, 16500,  83);

-- -------------------------------------------------------------
-- 10. DASHBOARD – TOP PRODUCTOS (8 rows)
-- -------------------------------------------------------------
INSERT INTO top_productos (sku, nombre, unid, total) VALUES
('7720001', 'Arroz blanco 1kg',         412, 2142400),
('7710101', 'Pan tajado integral',      388, 2638400),
('7702001', 'Leche entera 1L',          356, 1602000),
('7750001', 'Bebida gaseosa cola 1.5L', 280, 1820000),
('7760001', 'Huevos AA x12',            142, 1959600),
('7730001', 'Aceite girasol 1L',         96, 1392000),
('7770001', 'Papel higiénico x4',        88,  783200),
('7750002', 'Agua mineral 1.5L',        210,  735000);

-- -------------------------------------------------------------
-- 11. DASHBOARD – VENTAS DE HOY (7 rows)
-- -------------------------------------------------------------
INSERT INTO ventas_hoy (h, v) VALUES
('07', 145000),
('08', 280000),
('09', 340000),
('10', 410000),
('11', 520000),
('12', 690000),
('13', 480000);

-- -------------------------------------------------------------
-- 12. FACTURAS (60 rows) – Generated by PRNG seed=42
-- -------------------------------------------------------------
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10250', '2026-03-16', '16:56', 'Jesica Sánchez', 'Daviplata', 86300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10251', '2026-04-28', '09:26', 'Jeferson Ortiz', 'Transferencia', 10500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10252', '2026-03-29', '12:44', 'Jeferson Ortiz', 'Daviplata', 34500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10253', '2026-04-10', '11:45', 'Jeferson Ortiz', 'Efectivo', 8900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10254', '2026-03-11', '10:39', 'Jeferson Ortiz', 'Efectivo', 10500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10255', '2026-04-13', '14:47', 'Alejandro Vargas', 'Daviplata', 55500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10256', '2026-03-11', '07:02', 'Alejandro Vargas', 'Transferencia', 27900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10257', '2026-04-22', '12:31', 'Alejandro Vargas', 'Daviplata', 51600);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10258', '2026-03-16', '13:45', 'Jeferson Ortiz', 'Efectivo', 6800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10259', '2026-05-03', '19:33', 'Jesica Sánchez', 'Efectivo', 67300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10260', '2026-03-22', '08:11', 'Alejandro Vargas', 'Efectivo', 37600);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10261', '2026-03-31', '15:54', 'Alejandro Vargas', 'Efectivo', 42000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10262', '2026-04-21', '08:15', 'Jeferson Ortiz', 'Transferencia', 47000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10263', '2026-04-12', '17:56', 'Jesica Sánchez', 'Daviplata', 29500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10264', '2026-04-19', '11:26', 'Alejandro Vargas', 'Nequi', 45800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10265', '2026-03-20', '14:10', 'Alejandro Vargas', 'Daviplata', 32700);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10266', '2026-04-27', '15:34', 'Jeferson Ortiz', 'Nequi', 78300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10267', '2026-03-19', '11:54', 'Jesica Sánchez', 'Transferencia', 25900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10268', '2026-04-24', '18:19', 'Jeferson Ortiz', 'Nequi', 13000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10269', '2026-03-10', '17:57', 'Jeferson Ortiz', 'Daviplata', 30800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10270', '2026-05-07', '17:16', 'Jeferson Ortiz', 'Transferencia', 18300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10271', '2026-04-29', '10:35', 'Alejandro Vargas', 'Daviplata', 54200);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10272', '2026-05-05', '13:47', 'Jeferson Ortiz', 'Transferencia', 26800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10273', '2026-04-19', '07:34', 'Jesica Sánchez', 'Efectivo', 11300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10274', '2026-04-03', '09:02', 'Jeferson Ortiz', 'Nequi', 49700);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10275', '2026-04-04', '09:25', 'Jeferson Ortiz', 'Daviplata', 9600);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10276', '2026-03-20', '15:43', 'Jeferson Ortiz', 'Daviplata', 20900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10277', '2026-03-10', '18:54', 'Jesica Sánchez', 'Transferencia', 25600);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10278', '2026-03-30', '08:37', 'Jesica Sánchez', 'Daviplata', 33000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10279', '2026-03-19', '14:17', 'Alejandro Vargas', 'Efectivo', 34700);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10280', '2026-03-24', '18:01', 'Jeferson Ortiz', 'Daviplata', 35200);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10281', '2026-04-12', '10:57', 'Jesica Sánchez', 'Transferencia', 38000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10282', '2026-04-19', '16:22', 'Jesica Sánchez', 'Transferencia', 53400);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10283', '2026-03-30', '09:35', 'Alejandro Vargas', 'Transferencia', 24800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10284', '2026-04-22', '07:02', 'Alejandro Vargas', 'Efectivo', 64700);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10285', '2026-03-18', '16:25', 'Jeferson Ortiz', 'Nequi', 63300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10286', '2026-05-08', '12:55', 'Jesica Sánchez', 'Transferencia', 20400);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10287', '2026-05-03', '14:17', 'Alejandro Vargas', 'Nequi', 25900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10288', '2026-03-13', '14:41', 'Jesica Sánchez', 'Transferencia', 19300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10289', '2026-05-02', '11:03', 'Alejandro Vargas', 'Nequi', 15800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10290', '2026-03-23', '07:58', 'Alejandro Vargas', 'Transferencia', 26800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10291', '2026-03-22', '19:45', 'Alejandro Vargas', 'Nequi', 4200);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10292', '2026-04-06', '14:47', 'Alejandro Vargas', 'Efectivo', 8400);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10293', '2026-04-28', '14:21', 'Alejandro Vargas', 'Transferencia', 18800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10294', '2026-04-25', '09:04', 'Jeferson Ortiz', 'Daviplata', 68100);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10295', '2026-04-27', '12:22', 'Jesica Sánchez', 'Transferencia', 9800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10296', '2026-03-10', '07:25', 'Alejandro Vargas', 'Transferencia', 35800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10297', '2026-03-14', '16:00', 'Jesica Sánchez', 'Nequi', 58400);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10298', '2026-03-20', '09:07', 'Jesica Sánchez', 'Transferencia', 82600);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10299', '2026-03-11', '08:19', 'Alejandro Vargas', 'Transferencia', 80400);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10300', '2026-03-23', '15:17', 'Alejandro Vargas', 'Nequi', 83000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10301', '2026-04-08', '08:36', 'Jeferson Ortiz', 'Transferencia', 4900);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10302', '2026-04-23', '07:36', 'Alejandro Vargas', 'Efectivo', 21800);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10303', '2026-04-05', '11:16', 'Alejandro Vargas', 'Daviplata', 66500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10304', '2026-04-01', '15:45', 'Jeferson Ortiz', 'Efectivo', 36200);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10305', '2026-04-25', '12:10', 'Alejandro Vargas', 'Daviplata', 53000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10306', '2026-04-22', '17:27', 'Jeferson Ortiz', 'Efectivo', 34300);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10307', '2026-03-23', '09:40', 'Jesica Sánchez', 'Daviplata', 23000);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10308', '2026-03-19', '17:50', 'Jesica Sánchez', 'Efectivo', 24500);
INSERT INTO facturas (id, fecha, hora, cajero, metodo, total) VALUES ('F-10309', '2026-04-15', '12:32', 'Alejandro Vargas', 'Daviplata', 34500);

-- -------------------------------------------------------------
-- 13. FACTURA ITEMS (163 rows) – Generated by PRNG seed=42
-- -------------------------------------------------------------
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10250', '7770003', 'Detergente polvo 500g', 3, 9900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10250', '7740002', 'Sardinas en aceite 425g', 3, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10250', '7740003', 'Salsa de tomate 200g', 1, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10250', '7750004', 'Cerveza lager 330ml', 3, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10250', '7750004', 'Cerveza lager 330ml', 1, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10251', '7750002', 'Agua mineral 1.5L', 3, 3500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10252', '7740002', 'Sardinas en aceite 425g', 3, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10253', '7770001', 'Papel higiénico x4', 1, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10254', '7750002', 'Agua mineral 1.5L', 3, 3500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10255', '7770001', 'Papel higiénico x4', 2, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10255', '7730005', 'Chocolate de mesa 500g', 1, 9700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10255', '7770003', 'Detergente polvo 500g', 2, 9900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10255', '7720004', 'Pasta espagueti 500g', 2, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10256', '7750001', 'Bebida gaseosa cola 1.5L', 1, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10256', '7750001', 'Bebida gaseosa cola 1.5L', 2, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10256', '7710102', 'Galletas saladas x6', 2, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10257', '7702002', 'Yogurt natural 1L', 1, 7900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10257', '7730002', 'Azúcar blanca 1kg', 2, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10257', '7740003', 'Salsa de tomate 200g', 1, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10257', '7702004', 'Mantequilla 250g', 2, 6700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10257', '7760001', 'Huevos AA x12', 1, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10258', '7710101', 'Pan tajado integral', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10259', '7730005', 'Chocolate de mesa 500g', 2, 9700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10259', '7760003', 'Tomate chonto (kg)', 3, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10259', '7740003', 'Salsa de tomate 200g', 2, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10259', '7760003', 'Tomate chonto (kg)', 2, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10259', '7720002', 'Frijol rojo 500g', 2, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10260', '7740001', 'Atún en lata 170g', 2, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10260', '7760002', 'Banano (kg)', 2, 3200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10260', '7760002', 'Banano (kg)', 2, 3200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10260', '7750002', 'Agua mineral 1.5L', 2, 3500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10261', '7702002', 'Yogurt natural 1L', 2, 7900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10261', '7730002', 'Azúcar blanca 1kg', 1, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10261', '7760004', 'Cebolla cabezona (kg)', 3, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10261', '7702001', 'Leche entera 1L', 2, 4500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10262', '7750004', 'Cerveza lager 330ml', 2, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10262', '7720002', 'Frijol rojo 500g', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10262', '7720001', 'Arroz blanco 1kg', 2, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10262', '7760004', 'Cebolla cabezona (kg)', 2, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10263', '7740001', 'Atún en lata 170g', 3, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10263', '7730003', 'Sal refinada 1kg', 1, 2800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10264', '7720003', 'Lenteja 500g', 3, 5400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10264', '7720003', 'Lenteja 500g', 2, 5400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10264', '7720001', 'Arroz blanco 1kg', 1, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10264', '7710101', 'Pan tajado integral', 2, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10265', '7720002', 'Frijol rojo 500g', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10265', '7720004', 'Pasta espagueti 500g', 3, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10266', '7760002', 'Banano (kg)', 3, 3200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10266', '7702002', 'Yogurt natural 1L', 3, 7900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10266', '7730002', 'Azúcar blanca 1kg', 3, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10266', '7760001', 'Huevos AA x12', 2, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10267', '7730002', 'Azúcar blanca 1kg', 3, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10267', '7702003', 'Queso campesino 250g', 1, 8500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10268', '7750001', 'Bebida gaseosa cola 1.5L', 2, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10269', '7720004', 'Pasta espagueti 500g', 1, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10269', '7770001', 'Papel higiénico x4', 3, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10270', '7730002', 'Azúcar blanca 1kg', 2, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10270', '7702004', 'Mantequilla 250g', 1, 6700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10271', '7750001', 'Bebida gaseosa cola 1.5L', 1, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10271', '7710102', 'Galletas saladas x6', 3, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10271', '7760001', 'Huevos AA x12', 1, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10271', '7750004', 'Cerveza lager 330ml', 1, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10271', '7702003', 'Queso campesino 250g', 2, 8500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10272', '7770002', 'Jabón de baño 110g', 3, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10272', '7720002', 'Frijol rojo 500g', 2, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10273', '7750003', 'Jugo naranja 1L', 1, 5900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10273', '7720003', 'Lenteja 500g', 1, 5400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10274', '7760003', 'Tomate chonto (kg)', 3, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10274', '7750003', 'Jugo naranja 1L', 2, 5900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10274', '7730005', 'Chocolate de mesa 500g', 2, 9700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10274', '7760004', 'Cebolla cabezona (kg)', 1, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10275', '7760002', 'Banano (kg)', 3, 3200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10276', '7750004', 'Cerveza lager 330ml', 2, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10276', '7720004', 'Pasta espagueti 500g', 3, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10277', '7740001', 'Atún en lata 170g', 2, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10277', '7750004', 'Cerveza lager 330ml', 1, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10277', '7750002', 'Agua mineral 1.5L', 1, 3500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10278', '7770004', 'Crema dental 75ml', 1, 7600);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10278', '7770001', 'Papel higiénico x4', 1, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10278', '7720004', 'Pasta espagueti 500g', 3, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10278', '7710102', 'Galletas saladas x6', 1, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10279', '7770002', 'Jabón de baño 110g', 1, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10279', '7770003', 'Detergente polvo 500g', 1, 9900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10279', '7720002', 'Frijol rojo 500g', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10280', '7730005', 'Chocolate de mesa 500g', 1, 9700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10280', '7710102', 'Galletas saladas x6', 3, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10280', '7750004', 'Cerveza lager 330ml', 3, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10281', '7720001', 'Arroz blanco 1kg', 2, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10281', '7760001', 'Huevos AA x12', 2, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10282', '7740001', 'Atún en lata 170g', 1, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10282', '7760003', 'Tomate chonto (kg)', 3, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10282', '7720002', 'Frijol rojo 500g', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10282', '7740002', 'Sardinas en aceite 425g', 2, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10283', '7770002', 'Jabón de baño 110g', 3, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10283', '7730002', 'Azúcar blanca 1kg', 2, 5800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10284', '7740002', 'Sardinas en aceite 425g', 3, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10284', '7720001', 'Arroz blanco 1kg', 1, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10284', '7760003', 'Tomate chonto (kg)', 2, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10284', '7770004', 'Crema dental 75ml', 2, 7600);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10285', '7730001', 'Aceite girasol 1L', 3, 14500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10285', '7720001', 'Arroz blanco 1kg', 1, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10285', '7730005', 'Chocolate de mesa 500g', 1, 9700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10285', '7740003', 'Salsa de tomate 200g', 1, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10286', '7720002', 'Frijol rojo 500g', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10287', '7730001', 'Aceite girasol 1L', 1, 14500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10287', '7760004', 'Cebolla cabezona (kg)', 3, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10288', '7702002', 'Yogurt natural 1L', 1, 7900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10288', '7760004', 'Cebolla cabezona (kg)', 3, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10289', '7702002', 'Yogurt natural 1L', 2, 7900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10290', '7760002', 'Banano (kg)', 2, 3200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10290', '7720002', 'Frijol rojo 500g', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10291', '7710102', 'Galletas saladas x6', 1, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10292', '7730003', 'Sal refinada 1kg', 3, 2800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10293', '7730003', 'Sal refinada 1kg', 3, 2800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10293', '7720001', 'Arroz blanco 1kg', 2, 5200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10294', '7770004', 'Crema dental 75ml', 1, 7600);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10294', '7760001', 'Huevos AA x12', 2, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10294', '7760001', 'Huevos AA x12', 1, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10294', '7750003', 'Jugo naranja 1L', 1, 5900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10294', '7770002', 'Jabón de baño 110g', 3, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10295', '7760003', 'Tomate chonto (kg)', 2, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10296', '7710101', 'Pan tajado integral', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10296', '7730001', 'Aceite girasol 1L', 2, 14500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10297', '7720004', 'Pasta espagueti 500g', 1, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10297', '7760004', 'Cebolla cabezona (kg)', 2, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10297', '7770002', 'Jabón de baño 110g', 3, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10297', '7710101', 'Pan tajado integral', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10297', '7740001', 'Atún en lata 170g', 3, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10298', '7740003', 'Salsa de tomate 200g', 2, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10298', '7760001', 'Huevos AA x12', 3, 13800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10298', '7710101', 'Pan tajado integral', 2, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10298', '7770001', 'Papel higiénico x4', 2, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10299', '7740002', 'Sardinas en aceite 425g', 3, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10299', '7702003', 'Queso campesino 250g', 3, 8500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10299', '7710101', 'Pan tajado integral', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10300', '7710102', 'Galletas saladas x6', 3, 4200);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10300', '7770004', 'Crema dental 75ml', 3, 7600);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10300', '7710101', 'Pan tajado integral', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10300', '7710101', 'Pan tajado integral', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10300', '7720002', 'Frijol rojo 500g', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10301', '7740003', 'Salsa de tomate 200g', 1, 4900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10302', '7750003', 'Jugo naranja 1L', 3, 5900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10302', '7720004', 'Pasta espagueti 500g', 1, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10303', '7720003', 'Lenteja 500g', 2, 5400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10303', '7770002', 'Jabón de baño 110g', 1, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10303', '7702004', 'Mantequilla 250g', 3, 6700);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10303', '7720003', 'Lenteja 500g', 2, 5400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10303', '7710101', 'Pan tajado integral', 3, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10304', '7740002', 'Sardinas en aceite 425g', 2, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10304', '7770002', 'Jabón de baño 110g', 3, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10305', '7740001', 'Atún en lata 170g', 3, 8900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10305', '7720002', 'Frijol rojo 500g', 1, 6800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10305', '7750001', 'Bebida gaseosa cola 1.5L', 1, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10305', '7750001', 'Bebida gaseosa cola 1.5L', 2, 6500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10306', '7770002', 'Jabón de baño 110g', 2, 4400);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10306', '7702003', 'Queso campesino 250g', 3, 8500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10307', '7740002', 'Sardinas en aceite 425g', 2, 11500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10308', '7750004', 'Cerveza lager 330ml', 2, 4300);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10308', '7760004', 'Cebolla cabezona (kg)', 3, 3800);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10308', '7702001', 'Leche entera 1L', 1, 4500);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10309', '7770003', 'Detergente polvo 500g', 1, 9900);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10309', '7720004', 'Pasta espagueti 500g', 3, 4100);
INSERT INTO factura_items (factura_id, sku, nombre, q, precio) VALUES ('F-10309', '7720004', 'Pasta espagueti 500g', 3, 4100);

-- =============================================================
-- END OF SEED DATA
-- Total: 30 productos, 5 usuarios, 3 cajeros, 6 proveedores,
--        6 turnos, 5 ingresos, 35 ingreso_detalle,
--        6 ventas_mes, 3 ventas_cajero, 8 top_productos,
--        7 ventas_hoy, 60 facturas, 163 factura_items
-- =============================================================
