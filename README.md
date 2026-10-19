# Mapa de crecida del río Paraná

Web informativa que muestra, sobre un mapa 3D, **qué zonas se inundan a cada altura del río**.
MVP: **Paso de la Patria (Corrientes)**. Diseñada para sumar otras localidades del Paraná con un archivo de configuración.

> Estimación. No reemplaza las indicaciones oficiales de Prefectura, el municipio y Defensa Civil.

**En línea:** https://rio-parana-topaz.vercel.app · Vista 3D: https://rio-parana-topaz.vercel.app/?vista=3d

Se publica solo en Vercel con cada push a `claude/mvp-paso-de-la-patria` (rama de producción del proyecto `rio-parana`).

## Qué hace

- **Altura oficial del río** con fecha, hora, estado y fuente (Prefectura Naval). Una Edge Function de Supabase la
  registra cada 2 horas, con historial. Si Supabase no responde, la app prueba `GET /api/nivel` y después
  `public/data/nivel/<localidad>.json` (carga manual).
- **Gráfico de los últimos 30 días** y **crecidas de referencia** (1983: 9,54 m · 1998: 8,69 m · 2016: 7,78 m ·
  2023: 7,44 m), con datos del INA (API pública a5, sin token).
- **Relieve procesado** (`procesamiento/`): Copernicus GLO-30 corregido por cobertura del suelo, sin ruido y con
  las defensas como barreras. De ahí salen el modelo precalculado, los tiles del relieve 3D y las zonas
  inundables por nivel, que se guardan en Supabase (PostGIS).
- **Zonas inundadas ahora**, calculadas con esa altura y el relieve.
- **Simulador**: control deslizante (5 → 9,6 m, para llegar al pico de 1983) que muestra en rojo lo que se suma si el río sube y en verde lo que se libera si baja.
  Atajos a "Hoy", "Alerta" y "Pico pronosticado".
- **Conectividad hidráulica**: sólo se inunda lo conectado al río, no cualquier pozo más bajo.
- Mapa (MapLibre + relieve exagerado ×4), satélite / calles, vista 2D, ubicación del usuario.
- **Vista 3D** (three.js): maqueta estilizada del pueblo con el monte (ESA WorldCover) y los 9.812 edificios de
  Overture Maps. El agua sube con el simulador y los edificios alcanzados se pintan. Tocando un edificio, se ve
  a qué altura del río le llega el agua. **▶ Simular subida** anima la crecida en las dos vistas. Ver
  [docs/vista3d.md](docs/vista3d.md).
- Pensado primero para el celular (hoja inferior desplegable).

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173 (lee Supabase con la clave publicable de .env)
npm test           # tests del modelo y del parser de Prefectura
npm run build

# Procesamiento del relieve (Python 3.11+)
cd procesamiento
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
python procesar.py paso-de-la-patria             # Copernicus + correcciones → public/data/relieve/
python procesar.py paso-de-la-patria --subir     # además carga las zonas en Supabase (*)
python -m pytest
```

(*) `--subir` necesita `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno. La clave de servicio
**nunca** va al repo ni al frontend.

Detalles en [docs/procesamiento.md](docs/procesamiento.md) y [docs/supabase.md](docs/supabase.md).

Con la API en local: `npx vercel dev`. Deploy: importar el repo en Vercel (detecta Vite; `api/nivel.ts` queda como función).

Parámetros de URL:

| Parámetro | Ejemplo | Uso |
|---|---|---|
| `localidad` | `?localidad=paso-de-la-patria` | Localidad a mostrar |
| `cero` | `?cero=44.3` | Probar otra cota del cero del hidrómetro (calibración) |

## Cómo funciona el modelo

1. **Offline** (`procesamiento/procesar.py`): se corrige el DEM y, desde las celdas que la máscara de Copernicus marca
   como río, se corre un **Priority-Flood**. Para cada celda se obtiene la cota mínima del agua a la que queda
   conectada con el río. El resultado se guarda como PNG (`umbral.png`, `elev.png`, `cauce.png`).
2. **En la app**: un Web Worker carga esos PNG. Para cualquier altura `h`, `cota_agua = h + cota_cero_hidrometro`
   e `inundada ⇔ umbral ≤ cota_agua`. Por eso el deslizador responde al instante.
3. Si una localidad no tiene relieve procesado, el worker calcula lo mismo en el navegador con tiles públicos (SRTM).

El agua permanente (río y lagunas) se deja transparente y no se cuenta en las hectáreas. La app y el procesamiento
usan el mismo algoritmo (tests equivalentes en TypeScript y Python).

## Estructura

```
shared/localidades/     configuración por localidad (JSON, lo leen la app y Python) + registro
shared/fuentes/         formato de lectura de nivel (el parser de Prefectura vive en supabase/functions/_shared)
procesamiento/          pipeline de relieve en Python (rasterio, scipy, shapely)
supabase/               migraciones, seed y Edge Function registrar-nivel
public/data/relieve/    salida del pipeline: modelo precalculado y tiles 3D
api/nivel.ts            función serverless de respaldo: altura oficial normalizada (cache CDN 30 min)
src/lib/supabase.ts     lectura de Supabase (PostgREST, clave publicable)
src/lib/terreno.ts      descarga y decodificación del DEM (terrarium / mapbox terrain-RGB)
src/lib/inundacion.ts   algoritmo de inundación con conectividad
src/lib/modelo.worker.ts cálculo fuera del hilo principal
src/lib/capa.ts         pintado de la capa (inundado / se suma / se libera)
src/components/         Mapa (MapLibre) y Panel (nivel, simulador, leyenda)
src/vista3d/            Vista 3D (three.js, se carga sólo al abrirla)
public/data/nivel/      lecturas manuales de respaldo
docs/                   contexto del proyecto y calibración
```

## Sumar otra localidad

1. Copiar `shared/localidades/paso-de-la-patria.json` (y su `.ts`) y completar: `bbox`, `semillasRio`,
   `hidrometro` (cota del cero y nombre del puerto como figura en Prefectura), `umbrales`, `pronostico`.
2. Registrarla en `shared/localidades/index.ts`.
3. Insertar la fila en `public.localidades` de Supabase (ver `supabase/seed.sql`). Desde ese momento la Edge
   Function registra sus alturas.
4. `python procesamiento/procesar.py <id> --subir`.
5. Crear `public/data/nivel/<id>.json` como respaldo y abrir `?localidad=<id>`.

## Limitaciones conocidas (leer antes de difundir)

- **Cota del cero del hidrómetro provisoria** (44,00 m, estimada con los hidrómetros del INA de Itatí y Corrientes,
  que tienen cero IGN; antes 40,5 m, calibrada con edificios y descartada). Falta el dato oficial de Paso de la Patria.
  Ver `docs/calibracion.md`.
- **Relieve, probable sobreestimación**: con 44 m el modelo alcanza muchos edificios (~4.700 a 7,33 m). Copernicus
  corregido queda ~3 m por debajo del SRTM en tierra y la corrección por cobertura resta 2–3 m en zonas urbanas o
  con monte. Pendiente: validar con Sentinel-1/2 y revisar `correccionCobertura_m`.
- **Relieve de ~30 m (Copernicus)**: la corrección por cobertura es por clase (valores fijos por árbol, arbusto o edificio),
  no una medición. FABDEM o un vuelo con drone la reemplazan con `--dem`.
- **Defensas**: la tabla `defensas` está lista pero vacía. Hasta cargarlas, el modelo no sabe dónde están los terraplenes.
- Las **zonas en Supabase dependen de la cota del cero**. Si se corrige, hay que volver a correr `procesar.py --subir`.
  La capa de la app no, porque usa cotas absolutas.
- Falta la capa de agua observada por satélite (Sentinel-1) → Fase 3.

## Próximos pasos

- Confirmar el cero del hidrómetro con el dato oficial de INA / Prefectura (hoy interpolado entre Itatí y Corrientes).
- Validar el relieve con Sentinel-1/2 de la crecida de octubre de 2026 y ajustar `correccionCobertura_m`.
- Cargar defensas y terraplenes en Supabase y reprocesar.
- Probar FABDEM o MDE-Ar del IGN con `procesar.py --dem` y comparar.
- Script de Sentinel-1 en Google Earth Engine → GeoJSON de agua observada, y medir IoU contra el modelo.
- Centros de evacuados y teléfonos útiles en el mapa (con datos del municipio).
