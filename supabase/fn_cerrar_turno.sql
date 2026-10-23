-- ============================================================================
--  fn_cerrar_turno — Cierre de turno ATÓMICO e IDEMPOTENTE
--  Corre esto UNA vez en Supabase → SQL Editor.
--
--  Problema que resuelve: el cierre hacía 2 pasos separados (marcar turno
--  'cerrado' + registrar el arqueo). Si el mismo cajero tenía el turno abierto en
--  dos PCs, o algo se desincronizaba, podía quedar el arqueo creado pero el turno
--  aún 'abierto' (estado a medias), o duplicarse el cierre.
--
--  Esta función hace TODO en una sola transacción, con bloqueo de fila (FOR UPDATE):
--   - Si el turno no existe -> 'no_existe'.
--   - Si YA está cerrado    -> 'ya_cerrado' (no duplica, no rompe: idempotente).
--   - Si está abierto       -> lo marca 'cerrado' + upsert del arqueo -> 'ok'.
--  Dos equipos no pueden cerrarlo dos veces: el segundo ve 'ya_cerrado'.
-- ============================================================================

create or replace function fn_cerrar_turno(
  p_turno_id             text,
  p_fecha_fin            text,
  p_ventas               numeric,
  p_transacciones        integer,
  p_por_metodo           jsonb,
  p_base_inicial         numeric,
  p_ventas_efectivo      numeric,
  p_ventas_transferencia numeric,
  p_ventas_nequi         numeric,
  p_ventas_daviplata     numeric,
  p_total_ventas         numeric,
  p_esperado_efectivo    numeric,
  p_efectivo_contado     numeric,
  p_diferencia           numeric,
  p_observaciones        text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado text;
begin
  -- Bloquea la fila del turno: serializa cierres concurrentes de dos equipos.
  select estado into v_estado from turnos where id = p_turno_id for update;

  if not found then
    return 'no_existe';
  end if;

  if v_estado = 'cerrado' then
    return 'ya_cerrado';
  end if;

  update turnos
     set estado = 'cerrado',
         fecha_fin = p_fecha_fin,
         ventas = p_ventas,
         transacciones = p_transacciones,
         por_metodo = coalesce(p_por_metodo, por_metodo)
   where id = p_turno_id;

  insert into cierres_caja (
    turno_id, base_inicial, ventas_efectivo, ventas_transferencia, ventas_nequi,
    ventas_daviplata, total_ventas, transacciones, esperado_efectivo,
    efectivo_contado, diferencia, observaciones
  ) values (
    p_turno_id, p_base_inicial, p_ventas_efectivo, p_ventas_transferencia, p_ventas_nequi,
    p_ventas_daviplata, p_total_ventas, p_transacciones, p_esperado_efectivo,
    p_efectivo_contado, p_diferencia, p_observaciones
  )
  on conflict (turno_id) do update set
    base_inicial         = excluded.base_inicial,
    ventas_efectivo      = excluded.ventas_efectivo,
    ventas_transferencia = excluded.ventas_transferencia,
    ventas_nequi         = excluded.ventas_nequi,
    ventas_daviplata     = excluded.ventas_daviplata,
    total_ventas         = excluded.total_ventas,
    transacciones        = excluded.transacciones,
    esperado_efectivo    = excluded.esperado_efectivo,
    efectivo_contado     = excluded.efectivo_contado,
    diferencia           = excluded.diferencia,
    observaciones        = excluded.observaciones;

  return 'ok';
end;
$$;

-- Permitir llamarla desde la app (anon/authenticated usan la anon key)
grant execute on function fn_cerrar_turno(
  text, text, numeric, integer, jsonb, numeric, numeric, numeric, numeric,
  numeric, numeric, numeric, numeric, numeric, text
) to anon, authenticated;
