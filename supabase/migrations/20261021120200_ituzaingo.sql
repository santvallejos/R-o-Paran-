-- Localidad Ituzaingó (Corrientes). Generado desde shared/localidades/ituzaingo.json con
-- `node scripts/sql-localidad.ts ituzaingo`: no editar a mano, cambiar el JSON y regenerar.
-- Los valores operativos se pueden ajustar después en Supabase sin redeploy; los umbrales
-- los pisa la Edge Function registrar-nivel con los oficiales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'ituzaingo', 'Ituzaingó', 'Corrientes', 'Paraná', 'ITUZAINGO', 58.3, true,
  '[{"nombre":"Alerta","altura_m":3.5,"color":"#f59e0b"},{"nombre":"Evacuación","altura_m":4,"color":"#dc2626"}]',
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
