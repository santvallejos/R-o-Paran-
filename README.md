# Mapa de crecida del río Paraná

Web informativa que muestra, sobre un mapa 3D, **qué zonas se inundan a cada altura del río**.
MVP: **Paso de la Patria (Corrientes)**. Diseñada para sumar otras localidades del Paraná con un archivo de configuración.

> Estimación. No reemplaza las indicaciones oficiales de Prefectura, el municipio y Defensa Civil.

## Qué hace

- **Altura oficial del río** con fecha, hora y fuente (Prefectura Naval), vía `GET /api/nivel`.
  Si la fuente no responde, usa `public/data/nivel/<localidad>.json` (carga manual).
- **Zonas inundadas ahora**, calculadas con esa altura y el relieve.
- **Simulador**: control deslizante (5 → 8,5 m) que muestra en rojo lo que se suma si el río sube y en verde lo que se libera si baja.
  Atajos a "Hoy", "Alerta" y "Pico pronosticado".
- **Conectividad hidráulica**: sólo se inunda lo conectado al río, no cualquier pozo más bajo.
- Mapa 3D (MapLibre + relieve exagerado ×4), satélite / calles, vista 2D, ubicación del usuario.
- Pensado primero para el celular (hoja inferior desplegable).

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173  (sin /api: usa el JSON manual)
npm test           # tests del modelo y del parser de Prefectura
npm run build
```

Con la API en local: `npx vercel dev`. Deploy: importar el repo en Vercel (detecta Vite; `api/nivel.ts` queda como función).

Parámetros de URL:

| Parámetro | Ejemplo | Uso |
|---|---|---|
| `localidad` | `?localidad=paso-de-la-patria` | Localidad a mostrar |
| `cero` | `?cero=44.3` | Probar otra cota del cero del hidrómetro (calibración) |

## Cómo funciona el modelo

1. Se bajan los tiles de relieve que cubren el área de estudio y se arma una grilla de elevaciones (en un Web Worker).
2. Desde puntos dentro del cauce se corre un **Priority-Flood**: para cada celda se obtiene la cota mínima del agua a la que
   queda conectada con el río (camino minimax). Se calcula **una sola vez**.
3. Para cualquier altura `h`: `cota_agua = h + cota_cero_hidrometro` y `inundada ⇔ umbral ≤ cota_agua`.
   Por eso el deslizador responde al instante, sin precalcular polígonos por nivel.

El cauce permanente (lo que el DEM ya registra como agua) se deja transparente y no se cuenta en las hectáreas.

## Estructura

```
shared/localidades/     configuración por localidad (+ registro en index.ts)
shared/fuentes/         formato de lectura de nivel y parser de Prefectura
api/nivel.ts            función serverless: altura oficial normalizada (cache CDN 30 min)
src/lib/terreno.ts      descarga y decodificación del DEM (terrarium / mapbox terrain-RGB)
src/lib/inundacion.ts   algoritmo de inundación con conectividad
src/lib/modelo.worker.ts cálculo fuera del hilo principal
src/lib/capa.ts         pintado de la capa (inundado / se suma / se libera)
src/components/         Mapa (MapLibre) y Panel (nivel, simulador, leyenda)
public/data/nivel/      lecturas manuales de respaldo
docs/                   contexto del proyecto y calibración
```

## Sumar otra localidad

1. Copiar `shared/localidades/paso-de-la-patria.ts` y completar: `bbox`, `semillasRio` (puntos dentro del cauce),
   `hidrometro` (cota del cero y nombre del puerto como figura en Prefectura), `umbrales`, `pronostico`.
2. Registrarla en `shared/localidades/index.ts`.
3. Crear `public/data/nivel/<id>.json` como respaldo.
4. Abrir `?localidad=<id>`.

## Limitaciones conocidas (leer antes de difundir)

- **Cota del cero del hidrómetro provisoria** (44,00 m). Es el dato que más cambia el resultado. Ver `docs/calibracion.md`.
- **Relieve de ~30 m (SRTM)**: no ve terraplenes ni defensas; árboles y edificios elevan el terreno; hay ruido de ±1–2 m.
  Las manchas sueltas en la isla frente al pueblo son en parte ruido del DEM.
- El parser de Prefectura se escribió sin poder probarlo contra la página real (no accesible desde el entorno de desarrollo):
  verificarlo en el primer deploy (`/api/nivel`). Si falla, la app cae al JSON manual.
- Falta la capa de agua observada por satélite (Sentinel-1) → Fase 3.

## Próximos pasos

- Confirmar el cero del hidrómetro con INA / Prefectura y el sistema de alturas.
- Reemplazar el DEM por MDE-Ar del IGN (5 m si cubre) o un vuelo con drone, convertido a terrain-RGB (`dem.tiles` en la config).
- Sumar la línea de defensas/terraplenes como barreras del modelo.
- Script de Sentinel-1 en Google Earth Engine → GeoJSON de agua observada, y medir IoU contra el modelo.
- Centros de evacuados y teléfonos útiles en el mapa (con datos del municipio).
