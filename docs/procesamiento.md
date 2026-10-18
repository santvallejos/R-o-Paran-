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
| `procesamiento/salida/<id>/version.json` | Versión con zonas por nivel, el formato de `cargar_version_relieve`. |
| `procesamiento/salida/<id>/zonas.geojson` | Las mismas zonas para QGIS (no se versiona). |
| `procesamiento/salida/<id>/dem_corregido.tif`, `umbral.tif` | Para revisar en QGIS (no se versionan). |

Las descargas quedan en `procesamiento/cache/<id>/`. Para volver a bajar, se borra esa carpeta.

## Usar un DEM mejor

```bash
python procesar.py paso-de-la-patria --dem ~/descargas/fabdem.tif --nombre-dem "FABDEM v1-2" --sin-correccion-cobertura
python procesar.py paso-de-la-patria --dem odm_dem.tif --nombre-dem "Vuelo drone 2026-11"
```

- **FABDEM** (Copernicus sin árboles ni edificios, Univ. de Bristol, licencia CC BY-NC-SA): se usa con
  `--sin-correccion-cobertura`, porque ya viene corregido.
- **MDE-Ar del IGN**: verificar el sistema de alturas. Si difiere del de la cota del cero, ajustar la cota en la configuración.
- **Drone (OpenDroneMap)**: exportar el DTM, no el DSM.

## Primer procesamiento (18/10/2026)

- Pelo de agua del DEM: **45,00 m** (≈ 1,00 m en el hidrómetro con el cero provisorio de 44 m).
- Zonas: 5,0 m → 812 ha · 6,2 m → 1.138 ha · 7,4 m → 1.635 ha · 8,0 m → 1.871 ha (fuera del cauce, en el área de estudio).
- Defensas aplicadas: 0 (todavía no hay datos).
