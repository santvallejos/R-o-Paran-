-- Localidad Corrientes (Corrientes). Generado desde shared/localidades/corrientes.json con
-- `node scripts/sql-localidad.ts corrientes`: no editar a mano, cambiar el JSON y regenerar.
-- Los valores operativos se pueden ajustar después en Supabase sin redeploy; los umbrales
-- los pisa la Edge Function registrar-nivel con los oficiales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'corrientes', 'Corrientes', 'Corrientes', 'Paraná', 'CORRIENTES', 42.39, false,
  '[{"nombre":"Alerta","altura_m":6.5,"color":"#f59e0b"},{"nombre":"Evacuación","altura_m":7,"color":"#dc2626"}]',
  null
)
on conflict (id) do update set
  nombre = excluded.nombre,
  provincia = excluded.provincia,
  rio = excluded.rio,
  puerto_prefectura = excluded.puerto_prefectura,
  cota_cero_m = excluded.cota_cero_m,
  cota_cero_provisoria = excluded.cota_cero_provisoria,
  umbrales = excluded.umbrales,
  -- Si el JSON no trae pronóstico, se conserva el que se haya cargado en Supabase.
  pronostico = coalesce(excluded.pronostico, public.localidades.pronostico),
  actualizado_en = now();
