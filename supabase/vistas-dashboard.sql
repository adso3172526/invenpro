-- ============================================================================
-- InvenPro · Vistas que ALIMENTAN EL DASHBOARD (entregable de BD)
-- ----------------------------------------------------------------------------
-- El dashboard consume estas vistas (vía hidratación + ViewRefresher):
--   ventas_hoy        -> ventas de HOY agrupadas por HORA (+ nº de transacciones)
--   ventas_cajero_hoy -> ventas de HOY agrupadas por CAJERO
-- Correr en el SQL Editor de Supabase. security_invoker + grant a anon (como el
-- resto de vistas del taller).
-- ============================================================================

-- ---- ventas_hoy: por hora real de HOY -------------------------------------
-- facturas.hora es texto localizado ("04:31 p. m."); se parsea a hora 24h.
-- Reemplaza la versión vieja que agrupaba por el texto completo (gráfico mal
-- rotulado) y no traía conteo de transacciones.
DROP VIEW IF EXISTS ventas_hoy;
CREATE VIEW ventas_hoy
WITH (security_invoker = true) AS
SELECT
  lpad(
    (CASE
       WHEN hora ~* 'p' AND split_part(hora, ':', 1)::int <> 12 THEN split_part(hora, ':', 1)::int + 12
       WHEN hora ~* 'a' AND split_part(hora, ':', 1)::int = 12  THEN 0
       ELSE split_part(hora, ':', 1)::int
     END)::text, 2, '0') AS h,   -- hora "00".."23"
  SUM(total)::int AS v,          -- total facturado en esa hora
  COUNT(*)::int   AS n           -- nº de transacciones en esa hora
FROM facturas
WHERE fecha = (now() AT TIME ZONE 'America/Bogota')::date   -- "hoy" en zona Colombia (no UTC)
GROUP BY 1
ORDER BY 1;
GRANT SELECT ON ventas_hoy TO anon, authenticated;


-- ---- ventas_cajero_hoy: por cajero, solo HOY ------------------------------
-- (ventas_cajero sigue existiendo como acumulado histórico; esta es del día.)
CREATE OR REPLACE VIEW ventas_cajero_hoy
WITH (security_invoker = true) AS
SELECT
  cajero          AS nombre,
  SUM(total)::int AS total,
  COUNT(*)::int   AS transacciones
FROM facturas
WHERE fecha = (now() AT TIME ZONE 'America/Bogota')::date   -- "hoy" en zona Colombia (no UTC)
GROUP BY cajero
ORDER BY SUM(total) DESC;
GRANT SELECT ON ventas_cajero_hoy TO anon, authenticated;


-- ---- Verificación rápida ---------------------------------------------------
--   SELECT * FROM ventas_hoy;
--   SELECT * FROM ventas_cajero_hoy;
