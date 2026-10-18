-- Esquema inicial: localidades, alturas del río, relieve procesado y datos de calibración.
-- Lectura pública (anon) sólo de lo que se muestra en la web; toda escritura pasa por
-- service_role (procesamiento, Edge Function) o por el panel de Supabase.

create extension if not exists postgis with schema extensions;

-- Localidades ---------------------------------------------------------------
-- Datos operativos que el equipo o el municipio pueden actualizar sin redeploy.
-- La geometría del área de estudio y los parámetros de procesamiento viven en
-- shared/localidades/<id>.json.
create table public.localidades (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  nombre text not null,
  provincia text not null,
  rio text not null,
  puerto_prefectura text,
  cota_cero_m numeric(7, 3) not null,
  cota_cero_provisoria boolean not null default true,
  umbrales jsonb not null default '[]'::jsonb,
  pronostico jsonb,
  activa boolean not null default true,
  actualizado_en timestamptz not null default now()
);

-- Alturas del río -------------------------------------------------------------
create table public.lecturas_nivel (
  id bigint generated always as identity primary key,
  localidad_id text not null references public.localidades (id) on delete cascade,
  altura_m numeric(5, 2) not null check (altura_m between -5 and 20),
  variacion_m numeric(5, 2),
  medido_en timestamptz not null,
  fuente text not null,
  url text,
  modo text not null check (modo in ('automatico', 'manual')),
  registrado_en timestamptz not null default now(),
  unique (localidad_id, fuente, medido_en)
);
create index lecturas_nivel_localidad_fecha_idx on public.lecturas_nivel (localidad_id, medido_en desc);

create view public.ultima_lectura
with (security_invoker = true) as
select distinct on (localidad_id) *
from public.lecturas_nivel
order by localidad_id, medido_en desc, registrado_en desc;

-- Relieve procesado -----------------------------------------------------------
create table public.versiones_relieve (
  id bigint generated always as identity primary key,
  localidad_id text not null references public.localidades (id) on delete cascade,
  fuente_dem text not null,
  resolucion_m numeric(6, 2),
  cota_cero_m numeric(7, 3) not null,
  parametros jsonb not null default '{}'::jsonb,
  procesado_en timestamptz not null,
  activa boolean not null default false,
  registrado_en timestamptz not null default now()
);
create index versiones_relieve_localidad_idx on public.versiones_relieve (localidad_id);
create unique index versiones_relieve_una_activa on public.versiones_relieve (localidad_id) where activa;

create table public.zonas_inundables (
  id bigint generated always as identity primary key,
  version_id bigint not null references public.versiones_relieve (id) on delete cascade,
  altura_m numeric(4, 2) not null,
  cota_m numeric(7, 3) not null,
  superficie_ha numeric(10, 2) not null,
  geom extensions.geometry(MultiPolygon, 4326) not null,
  unique (version_id, altura_m)
);
create index zonas_inundables_geom_idx on public.zonas_inundables using gist (geom);

-- Calibración ----------------------------------------------------------------
-- Defensas y terraplenes: el procesamiento los usa como barreras que el agua no cruza
-- (hasta su cota de coronamiento, si se conoce).
create table public.defensas (
  id bigint generated always as identity primary key,
  localidad_id text not null references public.localidades (id) on delete cascade,
  nombre text,
  tipo text not null default 'defensa' check (tipo in ('terraplen', 'muro', 'defensa', 'otro')),
  cota_coronamiento_m numeric(7, 3),
  fuente text not null,
  geom extensions.geometry(LineString, 4326) not null,
  creado_en timestamptz not null default now()
);
create index defensas_localidad_idx on public.defensas (localidad_id);
create index defensas_geom_idx on public.defensas using gist (geom);

-- Puntos de control: "acá llegó el agua con el río a X m". Sólo se publican verificados.
create table public.puntos_control (
  id bigint generated always as identity primary key,
  localidad_id text not null references public.localidades (id) on delete cascade,
  altura_hidrometro_m numeric(5, 2) not null,
  observado_en timestamptz not null,
  descripcion text,
  foto_url text,
  fuente text not null,
  verificado boolean not null default false,
  geom extensions.geometry(Point, 4326) not null,
  creado_en timestamptz not null default now()
);
create index puntos_control_localidad_idx on public.puntos_control (localidad_id);
create index puntos_control_geom_idx on public.puntos_control using gist (geom);

-- RLS ------------------------------------------------------------------------
alter table public.localidades enable row level security;
alter table public.lecturas_nivel enable row level security;
alter table public.versiones_relieve enable row level security;
alter table public.zonas_inundables enable row level security;
alter table public.defensas enable row level security;
alter table public.puntos_control enable row level security;

create policy "lectura pública" on public.localidades for select to anon, authenticated using (activa);
create policy "lectura pública" on public.lecturas_nivel for select to anon, authenticated using (true);
create policy "lectura pública" on public.versiones_relieve for select to anon, authenticated using (true);
create policy "lectura pública" on public.zonas_inundables for select to anon, authenticated using (true);
create policy "lectura pública" on public.defensas for select to anon, authenticated using (true);
create policy "lectura pública de verificados" on public.puntos_control for select to anon, authenticated using (verificado);

-- Funciones ------------------------------------------------------------------
-- Zona inundable (GeoJSON) de la versión activa para la altura pedida
-- (el nivel precalculado inmediatamente inferior o igual).
create function public.zona_inundable(p_localidad text, p_altura numeric)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'type', 'Feature',
    'geometry', extensions.st_asgeojson(z.geom, 6)::jsonb,
    'properties', jsonb_build_object(
      'localidad', v.localidad_id,
      'altura_m', z.altura_m,
      'cota_m', z.cota_m,
      'superficie_ha', z.superficie_ha,
      'version', v.id,
      'fuente_dem', v.fuente_dem,
      'procesado_en', v.procesado_en
    )
  )
  from public.zonas_inundables z
  join public.versiones_relieve v on v.id = z.version_id
  where v.localidad_id = p_localidad and v.activa and z.altura_m <= p_altura
  order by z.altura_m desc
  limit 1
$$;

-- Carga una versión de relieve con sus zonas en una sola transacción.
-- Sólo para service_role (lo usa procesamiento/relieve.py).
create function public.cargar_version_relieve(p jsonb)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if coalesce((p ->> 'activar')::boolean, true) then
    update public.versiones_relieve set activa = false
    where localidad_id = p ->> 'localidad_id' and activa;
  end if;

  insert into public.versiones_relieve (localidad_id, fuente_dem, resolucion_m, cota_cero_m, parametros, procesado_en, activa)
  values (
    p ->> 'localidad_id',
    p ->> 'fuente_dem',
    (p ->> 'resolucion_m')::numeric,
    (p ->> 'cota_cero_m')::numeric,
    coalesce(p -> 'parametros', '{}'::jsonb),
    (p ->> 'procesado_en')::timestamptz,
    coalesce((p ->> 'activar')::boolean, true)
  )
  returning id into v_id;

  insert into public.zonas_inundables (version_id, altura_m, cota_m, superficie_ha, geom)
  select
    v_id,
    (z ->> 'altura_m')::numeric,
    (z ->> 'cota_m')::numeric,
    (z ->> 'superficie_ha')::numeric,
    extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(z -> 'geom'), 4326))
  from jsonb_array_elements(p -> 'zonas') z;

  return v_id;
end
$$;

revoke execute on function public.cargar_version_relieve(jsonb) from public, anon, authenticated;
grant execute on function public.cargar_version_relieve(jsonb) to service_role;
grant execute on function public.zona_inundable(text, numeric) to anon, authenticated;
