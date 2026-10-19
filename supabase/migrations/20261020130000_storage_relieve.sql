-- Bucket público `relieve` en Supabase Storage para los datos pesados de cada localidad
-- (modelo.json, elev/umbral/cauce.png, terreno/{z}/{x}/{y}.png, escena/…). Así dejan de ir
-- en git y en cada deploy de Vercel: la app los lee de
--   <SUPABASE_URL>/storage/v1/object/public/relieve/<id>/…
-- (variable VITE_RELIEVE_BASE). Los sube `procesar.py --subir-archivos` con la clave de servicio.
-- Idempotente: se puede volver a aplicar sin error.

-- Bucket ----------------------------------------------------------------------
-- public = true: los objetos se sirven sin token por /object/public/. 50 MB por archivo
-- alcanza para el edificios.json de una ciudad; sólo PNG, JSON y binarios (arboles.bin).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('relieve', 'relieve', true, 52428800, array['image/png', 'application/json', 'application/octet-stream'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Políticas -------------------------------------------------------------------
-- Lectura anónima de los objetos del bucket (también por la API autenticada, p. ej. para listar).
-- No hay políticas de insert/update/delete: sólo service_role (que saltea RLS) puede escribir.
drop policy if exists "relieve: lectura publica" on storage.objects;
create policy "relieve: lectura publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'relieve');
