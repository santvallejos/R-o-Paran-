-- Localidad inicial. Los valores operativos (cota del cero, umbrales, pronóstico)
-- se pueden editar después desde el panel de Supabase sin redeploy.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  'paso-de-la-patria', 'Paso de la Patria', 'Corrientes', 'Paraná', 'PASO DE LA PATRIA', 44.0, true,
  '[{"nombre": "Alerta", "altura_m": 6.5, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 7.0, "color": "#dc2626"}]',
  '{"desde_m": 7.1, "hasta_m": 7.5, "fuente": "Municipalidad de Paso de la Patria"}'
)
on conflict (id) do nothing;
