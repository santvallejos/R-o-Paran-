-- Localidad inicial. Los valores operativos (cota del cero, umbrales, pronóstico)
-- se pueden editar después desde el panel de Supabase sin redeploy.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'paso-de-la-patria', 'Paso de la Patria', 'Corrientes', 'Paraná', 'PASO DE LA PATRIA', 44.0, true,
  '[{"nombre": "Alerta", "altura_m": 6.8, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 7.5, "color": "#dc2626"}]',
  '{"desde_m": 7.1, "hasta_m": 7.5, "fuente": "Municipalidad de Paso de la Patria"}'
)
on conflict (id) do nothing;

-- Itatí, piloto de la ampliación al NEA (mismos datos que shared/localidades/itati.json y
-- la migración 20261020120000_itati.sql). Cero IGN del INA; umbrales de Prefectura e INA, que
-- la Edge Function mantiene al día.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'itati', 'Itatí', 'Corrientes', 'Paraná', 'ITATI', 45.66, false,
  '[{"nombre": "Alerta", "altura_m": 6.8, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 7.5, "color": "#dc2626"}]',
  null
)
on conflict (id) do nothing;

-- Campana (Bajo Paraná, mismos datos que shared/localidades/campana.json y la migración
-- 20261021120000_campana.sql). Cero IGN del INA (estación 41); umbrales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'campana', 'Campana', 'Buenos Aires', 'Paraná de las Palmas', 'CAMPANA', 0.418, false,
  '[{"nombre": "Alerta", "altura_m": 2.2, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 2.45, "color": "#dc2626"}]',
  null
)
on conflict (id) do nothing;

-- Zárate (Bajo Paraná, mismos datos que shared/localidades/zarate.json y la migración
-- 20261021120100_zarate.sql). Cero IGN del INA (estación 40); umbrales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'zarate', 'Zárate', 'Buenos Aires', 'Paraná de las Palmas', 'ZARATE', 0.243, false,
  '[{"nombre": "Alerta", "altura_m": 2.2, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 2.4, "color": "#dc2626"}]',
  null
)
on conflict (id) do nothing;

-- Ituzaingó (mismos datos que shared/localidades/ituzaingo.json y la migración
-- 20261021120200_ituzaingo.sql). Cero estimado y provisorio (el INA no publica cero IGN).
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'ituzaingo', 'Ituzaingó', 'Corrientes', 'Paraná', 'ITUZAINGO', 58.3, true,
  '[{"nombre": "Alerta", "altura_m": 3.5, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 4.0, "color": "#dc2626"}]',
  null
)
on conflict (id) do nothing;

-- Corrientes capital (mismos datos que shared/localidades/corrientes.json y la migración
-- 20261022120000_corrientes.sql). Cero IGN del INA (estación 19); umbrales de Prefectura e INA.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'corrientes', 'Corrientes', 'Corrientes', 'Paraná', 'CORRIENTES', 42.39, false,
  '[{"nombre": "Alerta", "altura_m": 6.5, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 7.0, "color": "#dc2626"}]',
  null
)
on conflict (id) do nothing;
