-- Prefectura publica el estado de cada puerto ("EVACUACION CRECE", "ALERTA BAJA", …)
-- y sus umbrales de alerta y evacuación. Se guarda el estado con cada lectura.
alter table public.lecturas_nivel add column estado text;

create or replace view public.ultima_lectura
with (security_invoker = true) as
select distinct on (localidad_id) *
from public.lecturas_nivel
order by localidad_id, medido_en desc, registrado_en desc;

-- Umbrales oficiales de Prefectura para Paso de la Patria (18/10/2026).
update public.localidades
set umbrales = '[{"nombre": "Alerta", "altura_m": 6.5, "color": "#f59e0b"}, {"nombre": "Evacuación", "altura_m": 7.0, "color": "#dc2626"}]',
    actualizado_en = now()
where id = 'paso-de-la-patria';
