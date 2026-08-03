-- ============================================================================
--  Envío AUTOMÁTICO diario de alertas de vencimiento (InvenPro)
--  Ejecuta la Edge Function `enviar-alerta` en modo { auto: true } cada día.
--
--  Corre esto UNA vez en el SQL Editor de Supabase (o como migración).
--  Requiere haber desplegado antes la función:  supabase functions deploy enviar-alerta
-- ============================================================================

-- 1) Extensiones necesarias (pg_cron = agenda, pg_net = llamadas HTTP salientes)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Guardar el service-role key en Vault (NO lo pongas en texto plano en el cron).
--    Copia tu service_role key desde: Project Settings → API → service_role.
--    Reemplaza PEGA_AQUI_TU_SERVICE_ROLE_KEY y ejecuta esta línea una sola vez.
--    (Si ya existe el secreto, primero: select vault.delete_secret('service_role_key');)
select vault.create_secret('PEGA_AQUI_TU_SERVICE_ROLE_KEY', 'service_role_key');

-- 3) Programar el envío diario.
--    '0 13 * * *' = 13:00 UTC = 08:00 en Colombia (UTC-5). Ajusta la hora si quieres.
--    Si necesitas reprogramar, primero: select cron.unschedule('alertas-vencimiento-diaria');
select cron.schedule(
  'alertas-vencimiento-diaria',
  '0 13 * * *',
  $$
  select net.http_post(
    url     := 'https://wwwfahcrwfowvnpusjbc.supabase.co/functions/v1/enviar-alerta',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := jsonb_build_object('auto', true)
  );
  $$
);

-- ── Utilidades ──────────────────────────────────────────────────────────────
-- Ver los jobs programados:
--   select jobid, schedule, jobname, active from cron.job;
-- Ver el historial de ejecuciones (éxito/fallo del cron):
--   select * from cron.job_run_details order by start_time desc limit 20;
-- Ver las respuestas de las llamadas HTTP hechas por pg_net:
--   select * from net._http_response order by created desc limit 20;
-- Probar el envío YA (sin esperar a la hora del cron), corre el mismo net.http_post
-- del paso 3 directamente en el SQL Editor.
