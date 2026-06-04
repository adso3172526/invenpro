-- InvenPro · Supabase Schema
-- 13 tablas + índices + RLS + función RPC

-- ===================== TABLAS CORE =====================

CREATE TABLE productos (
  sku       TEXT PRIMARY KEY,
  nombre    TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio    INTEGER NOT NULL,
  costo     INTEGER NOT NULL,
  stock     INTEGER NOT NULL DEFAULT 0,
  min       INTEGER NOT NULL DEFAULT 0,
  vence     DATE,
  unidad    TEXT NOT NULL DEFAULT 'und'
);

CREATE TABLE usuarios_sistema (
  usuario   TEXT PRIMARY KEY,
  pass      TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  rol       TEXT NOT NULL,
  permisos  TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE cajeros (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  doc           TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'Cajero',
  estado        TEXT NOT NULL DEFAULT 'activo',
  turno_activo  BOOLEAN NOT NULL DEFAULT false,
  ingreso       DATE,
  ventas_30d    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE proveedores (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  nit             TEXT,
  contacto        TEXT,
  tel             TEXT,
  email           TEXT,
  ciudad          TEXT,
  categoria       TEXT,
  terminos        TEXT,
  estado          TEXT NOT NULL DEFAULT 'activo',
  ingresos        INTEGER NOT NULL DEFAULT 0,
  ultimo_ingreso  DATE
);

CREATE TABLE turnos (
  id              TEXT PRIMARY KEY,
  cajero          TEXT NOT NULL,
  fecha_ini       TEXT NOT NULL,
  fecha_fin       TEXT,
  base_ini        INTEGER NOT NULL DEFAULT 200000,
  ventas          INTEGER NOT NULL DEFAULT 0,
  transacciones   INTEGER NOT NULL DEFAULT 0,
  estado          TEXT NOT NULL DEFAULT 'abierto'
);

CREATE TABLE facturas (
  id       TEXT PRIMARY KEY,
  fecha    DATE NOT NULL,
  hora     TEXT NOT NULL,
  cajero   TEXT NOT NULL,
  metodo   TEXT NOT NULL,
  total    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE factura_items (
  id         SERIAL PRIMARY KEY,
  factura_id TEXT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  sku        TEXT NOT NULL,
  nombre     TEXT NOT NULL,
  q          INTEGER NOT NULL DEFAULT 1,
  precio     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ingresos (
  id         TEXT PRIMARY KEY,
  fecha      DATE NOT NULL,
  proveedor  TEXT NOT NULL,
  items      INTEGER NOT NULL DEFAULT 0,
  costo      INTEGER NOT NULL DEFAULT 0,
  recibe     TEXT,
  factura    TEXT
);

CREATE TABLE ingreso_detalle (
  id          SERIAL PRIMARY KEY,
  ingreso_id  TEXT NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
  sku         TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 0,
  costo       INTEGER NOT NULL DEFAULT 0,
  vence       DATE
);

-- ===================== TABLAS DASHBOARD =====================

CREATE TABLE ventas_mes (
  mes            TEXT PRIMARY KEY,
  total          INTEGER NOT NULL DEFAULT 0,
  transacciones  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ventas_cajero (
  id       TEXT PRIMARY KEY,
  nombre   TEXT NOT NULL,
  total    INTEGER NOT NULL DEFAULT 0,
  ticket   INTEGER NOT NULL DEFAULT 0,
  trans    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE top_productos (
  sku     TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  unid    INTEGER NOT NULL DEFAULT 0,
  total   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ventas_hoy (
  h  TEXT PRIMARY KEY,
  v  INTEGER NOT NULL DEFAULT 0
);

-- ===================== ÍNDICES =====================

CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_vence ON productos(vence);
CREATE INDEX idx_facturas_fecha ON facturas(fecha);
CREATE INDEX idx_facturas_cajero ON facturas(cajero);
CREATE INDEX idx_factura_items_factura ON factura_items(factura_id);
CREATE INDEX idx_ingreso_detalle_ingreso ON ingreso_detalle(ingreso_id);

-- ===================== RLS =====================

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingreso_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_mes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_cajero ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_hoy ENABLE ROW LEVEL SECURITY;

-- Política permisiva (proyecto académico)
CREATE POLICY allow_all ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON usuarios_sistema FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON cajeros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON facturas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON factura_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON ingreso_detalle FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON ventas_mes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON ventas_cajero FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON top_productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON ventas_hoy FOR ALL USING (true) WITH CHECK (true);

-- ===================== FUNCIÓN RPC =====================

CREATE OR REPLACE FUNCTION decrement_stock(p_sku TEXT, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE productos
  SET stock = GREATEST(0, stock - p_qty)
  WHERE sku = p_sku;
END;
$$ LANGUAGE plpgsql;
