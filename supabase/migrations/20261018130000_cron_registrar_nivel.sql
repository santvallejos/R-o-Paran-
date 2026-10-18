-- Registro automático de la altura del río: pg_cron llama a la Edge Function
-- registrar-nivel cada 2 horas (minuto 7, para no coincidir con la hora en punto).
--
-- Requiere dos secretos en Vault (una vez por proyecto):
--   select vault.create_secret('https://<ref>.supabase.co', 'url_proyecto');
--   select vault.create_secret('<clave anon (JWT)>', 'clave_anon');
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'registrar-nivel',
  '7 */2 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_proyecto') || '/functions/v1/registrar-nivel',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'clave_anon')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
