-- ============================================================================
--  Agrega el campo "nota" al detalle de ingreso de mercancía.
--  Permite anotar novedades por ítem al recibir (cantidad incompleta,
--  precio distinto, avería, etc.). Corre esto UNA vez en el SQL Editor.
-- ============================================================================

ALTER TABLE ingreso_detalle
  ADD COLUMN IF NOT EXISTS nota TEXT;
