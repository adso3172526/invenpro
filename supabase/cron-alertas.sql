-- ============================================================================
--  Envío AUTOMÁTICO diario de alertas de vencimiento (InvenPro)
--  Llama a la Edge Function `enviar-alerta` en modo { auto: true } cada día.
--
--  Pega TODO en Supabase -> SQL Editor y ejecútalo. Es idempotente
--  (puedes correrlo de nuevo sin romper nada).
--
--  IMPORTANTE antes de correr:
--  1) La función debe estar desplegada con el slug EXACTO `enviar-alerta`.
--  2) pg_cron y pg_net deben estar ACTIVADAS desde el panel:
--     Database -> Extensions -> buscar "pg_cron" y "pg_net" -> Enable.
--     (El `create extension` de abajo ayuda, pero en Supabase el worker de
--      pg_cron solo arranca si la extensión está activada desde ese panel.)
-- ============================================================================

-- 1) Extensiones (agenda + llamadas HTTP salientes)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Borrar el job anterior si existe (para re-crearlo limpio).
--    Si no existía, esta línea simplemente no hace nada (va en un bloque seguro).
do $$
begin
  perform cron.unschedule('alertas-vencimiento-diaria');
exception when others then
  null; -- no existía, se ignora
end $$;

-- 3) Programar el envío diario.
--    '0 13 * * *' = 13:00 UTC = 08:00 en Colombia (UTC-5). Cambia la hora si quieres.
--    Usa la ANON KEY (pública) como Bearer: basta para pasar el gateway; la función
--    lee la BD con su propio service_role interno, no con este token.
select cron.schedule(
  'alertas-vencimiento-diaria',
  '0 13 * * *',
  $$
  select net.http_post(
    url     := 'https://wwwfahcrwfowvnpusjbc.supabase.co/functions/v1/enviar-alerta',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2ZhaGNyd2Zvd3ZucHVzamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjUyOTIsImV4cCI6MjA5NjE0MTI5Mn0.umZOMowkRGeuASytetlcKUrSjnNGiM6UgxJnzDV1JYE'
    ),
    body    := jsonb_build_object('auto', true)
  );
  $$
);

-- 4) VERIFICAR que quedó programado y activo (debe salir 1 fila, active = true)
select jobid, jobname, schedule, active from cron.job
where jobname = 'alertas-vencimiento-diaria';

-- ============================================================================
--  (OPCIONAL) PROBAR YA, sin esperar a las 08:00.
--  OJO: esto ENVIA CORREOS REALES a los destinatarios configurados.
--  Quita el comentario de las 8 lineas de abajo SOLO si quieres probar ahora.
-- ============================================================================
-- select net.http_post(
--   url     := 'https://wwwfahcrwfowvnpusjbc.supabase.co/functions/v1/enviar-alerta',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2ZhaGNyd2Zvd3ZucHVzamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjUyOTIsImV4cCI6MjA5NjE0MTI5Mn0.umZOMowkRGeuASytetlcKUrSjnNGiM6UgxJnzDV1JYE'
--   ),
--   body    := jsonb_build_object('auto', true)
-- );
-- -- y mira la respuesta HTTP que hizo pg_net (status 200 = ok):
-- select id, status_code, content from net._http_response order by created desc limit 3;
