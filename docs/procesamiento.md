# Procesamiento del relieve

`procesamiento/procesar.py <localidad>` toma la configuración de `shared/localidades/<id>.json` y genera
todo lo que usa la app.

## Pasos

| # | Paso | Detalle | Parámetro (`procesamiento` en el JSON) |
|---|---|---|---|
| 1 | Relieve | Copernicus GLO-30 (COG en AWS, 30 m, 2011–2015, alturas EGM2008). O un GeoTIFF propio con `--dem`. | — |
| 2 | Agua | Máscara WBM de Copernicus: río (3) y lagunas (2). Las celdas de río son las **semillas** del modelo; si no hay, se usan `semillasRio`. | — |
| 3 | Cobertura | ESA WorldCover 2021 (10 m). Copernicus mide sobre la copa de árboles y techos: se resta un valor por clase, suavizado. | `correccionCobertura_m` |
| 4 | Ruido | Mediana sobre tierra para sacar el moteado del radar. | `filtroMediana_px` |
| 5 | Piso | En tierra no se aceptan cotas bajo el pelo de agua del DEM (artefactos de la corrección). | — |
| 6 | Defensas | Líneas de `procesamiento/datos/<id>/defensas.geojson` y/o de la tabla `defensas` de Supabase, como celdas que el agua no cruza hasta su `cota_m` (o nunca, si no se conoce). | — |
| 7 | Modelo | Priority-Flood (4 vecinos) → cota de inundación de cada celda. | — |
| 8 | Salidas | Ver abajo. | `zoomTiles`, `nivelesZonas_m`, `simplificarZonas_m` |

Todo se reproyecta a una grilla Web Mercator alineada con los píxeles de tiles al zoom `dem.zoomModelo`
(z14 ≈ 8,5 m en Corrientes). Así la app superpone el modelo sin otra reproyección.

## Salidas

| Archivo | Uso |
|---|---|
| `public/data/relieve/<id>/modelo.json` + `elev.png`, `umbral.png`, `cauce.png` | Modelo precalculado que carga la app. Los PNG van en codificación Terrarium; `umbral = 9000` significa que esa celda nunca se conecta con el río. |
| `public/data/relieve/<id>/terreno/{z}/{x}/{y}.png` + `terreno.json` | Relieve 3D corregido (terrain-RGB), en el área de estudio más un margen. |
| `public/data/relieve/<id>/escena/` (`cobertura.png`, `arboles.bin`, `edificios.json`) | Datos de la Vista 3D: clase de WorldCover por celda, árboles en celdas de monte y huellas de edificios de **Overture Maps** con la cota a la que les llega el agua. Ver [vista3d.md](vista3d.md). |
| `procesamiento/salida/<id>/version.json` | Versión con zonas por nivel, el formato de `cargar_version_relieve`. |
| `procesamiento/salida/<id>/zonas.geojson` | Las mismas zonas para QGIS (no se versiona). |
| `procesamiento/salida/<id>/dem_corregido.tif`, `umbral.tif` | Para revisar en QGIS (no se versionan). |

Las descargas quedan en `procesamiento/cache/<id>/`. Para volver a bajar, se borra esa carpeta.

`terreno.json` guarda `tiles` relativo a la carpeta de la localidad (`terreno/{z}/{x}/{y}.png`); la app lo
resuelve contra donde estén los archivos. Los `terreno.json` viejos, con `/data/relieve/<id>/…`, siguen andando.

### Subir los archivos a Supabase Storage

La carpeta `public/data/relieve/<id>/` pesa de ~10 MB (pueblos) a 50–150 MB (ciudades). Para no versionarla
ni mandarla en cada deploy, se sube al bucket público `relieve` (ver [supabase.md](supabase.md#storage-datos-pesados-del-relieve)):

```bash
python procesar.py paso-de-la-patria --subir-archivos        # procesa y al final sube la carpeta
python procesar.py paso-de-la-patria --solo-subir-archivos   # sólo sube lo ya generado, sin reprocesar
```

Sube cada `.png`, `.json` y `.bin` a `relieve/<id>/<ruta>` con upsert, `Content-Type` por extensión y
`Cache-Control: max-age=86400`, con 8 subidas en paralelo y reintentos ante errores de red, 429 o 5xx.
Necesita `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno, como `--subir`.

## Usar un DEM mejor

```bash
python procesar.py paso-de-la-patria --dem ~/descargas/fabdem.tif --nombre-dem "FABDEM v1-2" --sin-correccion-cobertura
python procesar.py paso-de-la-patria --dem odm_dem.tif --nombre-dem "Vuelo drone 2026-11"
```

- **FABDEM** (Copernicus sin árboles ni edificios, Univ. de Bristol, licencia CC BY-NC-SA): se usa con
  `--sin-correccion-cobertura`, porque ya viene corregido.
- **MDE-Ar del IGN**: verificar el sistema de alturas. Si difiere del de la cota del cero, ajustar la cota en la configuración.
- **Drone (OpenDroneMap)**: exportar el DTM, no el DSM.

Los edificios se bajan del GeoParquet público de Overture Maps (S3, última release) con pyarrow, leyendo sólo los
bloques que caen en el área. Tarda ~1 minuto y queda en caché. `--sin-escena3d` saltea este paso.

## Primer procesamiento (18/10/2026)

- Pelo de agua del DEM: **45,00 m** (≈ 1,00 m en el hidrómetro con el cero de 44 m). Es un valor editado por
  Copernicus, no una medición del río (ver [calibracion.md](calibracion.md)).
- Zonas con cero 44 m (versión vigente, estimado con los hidrómetros del INA): 5,0 m → 812 ha · 7,4 m → 1.635 ha · 8,0 m → 1.871 ha.
- Zonas con cero 40,5 m (calibración por edificios, descartada): 5,0 m → 25 ha · 6,2 m → 169 ha · 7,4 m → 423 ha · 8,0 m → 679 ha (fuera del cauce, en el área de estudio).
- Si Supabase todavía tiene las zonas de 40,5 m, regenerarlas con `procesar.py paso-de-la-patria --subir`.
- Escena 3D: 120.000 árboles y 9.812 edificios (Overture 2026-09-23.1). El 21/10/2026 `maxArboles` bajó a
  25.000 (lo que dibuja la vista 3D desde que tiene una sola calidad): `arboles.bin` pasó de 720 KB a 150 KB.
- Defensas aplicadas: 0 (todavía no hay datos).
