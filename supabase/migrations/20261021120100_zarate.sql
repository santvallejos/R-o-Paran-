-- Localidad Zárate (Buenos Aires). Generado desde shared/localidades/zarate.json con
-- `node scripts/sql-localidad.ts zarate`: no editar a mano, cambiar el JSON y regenerar.
-- Los valores operativos se pueden ajustar después en Supabase sin redeploy; los umbrales
-- los pisa la Edge Function registrar-nivel con los oficiales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'zarate', 'Zárate', 'Buenos Aires', 'Paraná de las Palmas', 'ZARATE', 0.243, false,
  '[{"nombre":"Alerta","altura_m":2.2,"color":"#f59e0b"},{"nombre":"Evacuación","altura_m":2.4,"color":"#dc2626"}]',
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
