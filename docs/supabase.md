# Base de datos (Supabase)

Proyecto `crecida-parana` (región São Paulo). Esquema en `supabase/migrations/`, datos iniciales en `supabase/seed.sql`.

## Tablas

| Tabla | Qué guarda | Lectura pública | Quién escribe |
|---|---|---|---|
| `localidades` | Datos operativos: cota del cero, umbrales, pronóstico. La app los toma de acá, sin redeploy. | sí (activas) | panel de Supabase · Edge Function (umbrales oficiales) |
| `lecturas_nivel` | Historial de alturas, con fecha, estado, fuente y modo (automático o manual). | sí | Edge Function · carga manual |
| `ultima_lectura` (vista) | La lectura más reciente por localidad. | sí | — |
| `versiones_relieve` | Cada corrida de `procesar.py`: fuente, parámetros y cota del cero usada. Una sola activa por localidad. | sí | `cargar_version_relieve` |
| `zonas_inundables` | MultiPolygon (EPSG:4326) por altura del hidrómetro y versión. | sí | `cargar_version_relieve` |
| `defensas` | Líneas de defensas y terraplenes, con cota de coronamiento si se conoce. Las usa el procesamiento. | sí | panel / equipo |
| `puntos_control` | "Acá llegó el agua con el río a X m" (foto, GPS). Para calibrar. | sólo verificados | panel / equipo |

RLS está activo en todas las tablas. La clave publicable (navegador) sólo puede leer. Las escrituras usan la clave
de servicio (Edge Function y `procesar.py --subir`) o el panel de Supabase.

## Funciones

- `zona_inundable(p_localidad, p_altura)` → GeoJSON Feature de la versión activa (el nivel precalculado ≤ altura). Pública:
  `POST /rest/v1/rpc/zona_inundable {"p_localidad": "paso-de-la-patria", "p_altura": 7.33}`.
  Sirve para compartir la zona con el municipio o para cruzarla con calles y centros de evacuados.
- `cargar_version_relieve(p jsonb)` → carga una versión con sus zonas en una sola transacción y la deja activa.
  Sólo para `service_role`.

## Storage: datos pesados del relieve

Bucket público `relieve` (migración `20261020130000_storage_relieve.sql`): lectura anónima, escritura sólo con
la clave de servicio, hasta 50 MB por archivo y sólo `image/png`, `application/json` y `application/octet-stream`.
Guarda la salida de `procesar.py` con la misma estructura que `public/data/relieve/`:

```
relieve/<id>/modelo.json, terreno.json, elev.png, umbral.png, cauce.png
relieve/<id>/terreno/{z}/{x}/{y}.png
relieve/<id>/escena/cobertura.png, arboles.bin, edificios.json
```

La app lo usa si está definida la variable de build **`VITE_RELIEVE_BASE`** con la URL pública del bucket:

```bash
VITE_RELIEVE_BASE=https://<ref>.supabase.co/storage/v1/object/public/relieve
```

Sin la variable, la app lee de `/data/relieve/<id>/` del propio sitio (desarrollo local o deploy con los
datos en el repo). Ver `src/lib/relieve.ts`. En Vercel se carga en *Settings → Environment Variables* y
requiere un redeploy (Vite la incrusta en el build).

Subida (desde `procesamiento/`, con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno):

```bash
python procesar.py paso-de-la-patria --solo-subir-archivos   # sube lo ya generado
python procesar.py itati --subir --subir-archivos            # procesa, carga zonas y sube archivos
```

Comprobar que un archivo quedó público y con el tipo correcto:

```bash
curl -sI https://<ref>.supabase.co/storage/v1/object/public/relieve/paso-de-la-patria/modelo.json | grep -i content-type
```

## Registro automático de alturas

- Edge Function `registrar-nivel` (`supabase/functions/registrar-nivel/`): lee la tabla de Prefectura y guarda
  altura, variación, fecha y estado de cada localidad activa con `puerto_prefectura`. Actualiza los umbrales
  oficiales (alerta / evacuación). Si ya registró hace menos de 20 minutos, no vuelve a consultar
  (`?forzar` lo saltea).
- `pg_cron` la llama cada 2 horas, en el minuto 7. Usa dos secretos de Vault: `url_proyecto` y `clave_anon`.

Ver las últimas corridas:

```sql
select * from cron.job_run_details order by start_time desc limit 5;
select id, status_code, content from net._http_response order by id desc limit 5;
```

## Carga manual de una lectura

Si Prefectura no publica, desde el SQL Editor:

```sql
insert into lecturas_nivel (localidad_id, altura_m, medido_en, fuente, modo, estado)
values ('paso-de-la-patria', 7.40, '2026-10-19 08:00-03', 'Parte municipal', 'manual', 'EVACUACION CRECE');
```

## Desplegar en otro proyecto

```bash
supabase link --project-ref <ref>
supabase db push                      # migraciones (incluye el bucket `relieve`)
psql "$DB_URL" -f supabase/seed.sql   # localidad inicial
supabase functions deploy registrar-nivel
# y en el SQL Editor crear los secretos de Vault que pide la migración del cron
```
