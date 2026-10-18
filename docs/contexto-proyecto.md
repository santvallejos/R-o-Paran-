# Mapa 3D de crecida — Paso de la Patria (Corrientes)

> Documento de arranque del proyecto. Pensado para que otro agente (o desarrollador) tome el contexto y empiece a construir.

## 1. Contexto

- En octubre de 2026 el río Paraná está en creciente en Paso de la Patria (Corrientes, Argentina). Superó la fase de alerta de 6,50 m en el hidrómetro del puerto y está en etapa de evacuación.
- El municipio proyecta un pico de entre 7,10 y 7,50 m. Hay evacuados y centros habilitados para recibirlos.
- La información se dispersa entre Prefectura, el INA, el municipio y redes sociales. No hay una forma visual y simple de ver **qué zonas del pueblo se inundan a cada altura del río**.

## 2. Objetivo

Hacer una **web con un mapa 3D** del pueblo que muestre:

1. La **altura actual del río**, tomada de fuentes oficiales y actualizada automáticamente.
2. Las **zonas inundadas ahora**, estimadas con esa altura y el terreno.
3. Un **simulador** con un control deslizante para ver qué zonas se suman o se liberan si el río sube o baja (6 m → 8 m).
4. Una capa de **agua observada por satélite** (Sentinel-1), para contrastar el modelo con la realidad.

Público: vecinos afectados, voluntarios, el municipio y Defensa Civil.

## 3. Alcance del MVP

**Incluye:**
- Mapa 3D con relieve del área urbana de Paso de la Patria.
- Plano de agua a la altura del río y un control deslizante para cambiarla.
- Inundación calculada con conectividad hidráulica: solo se inunda lo que está conectado al río, no cualquier pozo que quede más bajo.
- Indicador de la última altura oficial, con fecha, hora y fuente.
- Aviso visible: "Estimación. No reemplaza las indicaciones oficiales."
- Diseño que funcione bien en el celular (prioridad).

**No incluye (por ahora):**
- Carga de donaciones o voluntarios.
- Cuentas de usuario.
- Pronóstico propio de la crecida (se usa el pronóstico oficial del INA).

## 4. Fuentes de datos

| Dato | Fuente | Notas |
|---|---|---|
| Altura del río (actual y pronóstico) | INA (Sistema de Alerta Hidrológico, cuenca del Plata), Prefectura Naval (hidrómetro del puerto de Paso de la Patria) | Se actualiza unas pocas veces por día, no es minuto a minuto. Hay que ver si existe una API o si hay que hacer scraping. |
| Historial de alturas | INA | Para calibrar contra crecidas pasadas (por ejemplo, 1998 y 2016). |
| Terreno (DEM) | IGN, MDE-Ar (30 m, y 5 m donde haya); Copernicus GLO-30 como alternativa | 30 m es grueso para un pueblo plano y no muestra terraplenes. |
| Terreno de alta resolución | Vuelo con drone procesado con OpenDroneMap | Fase posterior; es lo que más mejora la precisión. |
| Agua observada (radar) | Sentinel-1, vía Google Earth Engine | Ve a través de las nubes; pasa cada pocos días. |
| Agua observada (óptico) | Sentinel-2 y Landsat | No sirve si hay nubes. |
| Radar argentino | SAOCOM (CONAE) | Hay que registrarse para descargar. |
| Puntos de control en el terreno | Fotos con GPS de vecinos, el municipio o Prefectura | Ejemplo: "acá llegó el agua con el río a 7,20 m". |
| Calles, manzanas y edificios | OpenStreetMap | Para mostrar qué calles se afectan. |
| Riesgo oficial | COE de la provincia de Corrientes y municipio | Pedir los mapas de riesgo que ya tengan. |

## 5. Problema técnico clave: el cero del hidrómetro

La altura que publica Prefectura (por ejemplo, 7,20 m) se mide **desde el cero de la escala del hidrómetro**, no desde el nivel del mar. Para comparar el agua con el terreno hay que convertirla:

```
cota_agua (IGN, m) = altura_hidrometro (m) + cota_cero_hidrometro (IGN, m)
```

- Conseguir `cota_cero_hidrometro` del puerto de Paso de la Patria, a través del INA, Prefectura o Vías Navegables.
- Verificar que esté en el mismo sistema de alturas que el DEM. Si no lo está, ajustar la diferencia.
- Si no se consigue, estimarla comparando el borde del agua en Sentinel-1 con el DEM en una fecha de altura conocida.

## 6. Arquitectura propuesta

```
[INA / Prefectura] --(job programado)--> [API de altura del río] --> [Frontend 3D]
[DEM + calibración] --(procesamiento offline)--> [Tiles de terreno + capas por altura] --> [Frontend 3D]
[Sentinel-1 en GEE] --(script periódico)--> [Polígono de agua observada (GeoJSON)] --> [Frontend 3D]
```

### Frontend
- React con Vite y TypeScript.
- Mapa 3D: **MapLibre GL JS** con terreno, más **deck.gl** para las capas. Alternativa: CesiumJS si hace falta más realismo 3D.
- Control deslizante de altura, leyenda, indicador de la última medición y una capa que se puede prender o apagar ("modelo" o "satélite").
- Deploy en Vercel.

### Backend / jobs
- Un job programado (cron) que lea la altura oficial, la normalice y la guarde con fecha, hora y fuente.
- Opciones: una función serverless (Vercel Cron o AWS Lambda con EventBridge) que guarde los datos en Supabase/Postgres o en un JSON estático.
- Un endpoint simple: `GET /api/nivel` → `{ altura_m, cota_ign_m, fecha, fuente }`.

### Procesamiento geoespacial (offline, en Python)
- Recortar el DEM al área de Paso de la Patria (GDAL o rasterio).
- Convertirlo a tiles de terreno (terrain-RGB) para MapLibre.
- Calcular las áreas inundadas con un algoritmo de "bañera" con conectividad: partir desde una celda del río y avanzar por las celdas vecinas que estén por debajo de la cota del agua.
- Generar de antemano un polígono por cada nivel (por ejemplo, cada 10 cm entre 6,00 y 8,50 m) para que el control deslizante responda al instante en el celular.
- Script de Google Earth Engine para Sentinel-1: filtrar por fecha y zona, aplicar un umbral en la banda VV para detectar agua y exportar el resultado como GeoJSON.

## 7. Calibración y validación

1. Elegir fechas con imágenes de Sentinel-1 y altura del río conocida (de esta crecida y de crecidas anteriores).
2. Comparar el área inundada por el modelo con el área que muestra el satélite, usando una métrica como IoU.
3. Ajustar el valor del cero del hidrómetro y marcar a mano los terraplenes y defensas (como líneas que el agua no cruza).
4. Agregar los puntos de control que vengan de fotos con GPS.
5. Documentar el margen de error estimado y mostrarlo en la interfaz.

## 8. Plan por fases

- **Fase 0, investigación:** confirmar las fuentes de altura y si tienen API, conseguir el cero del hidrómetro, bajar el DEM y definir el área de estudio.
- **Fase 1, prototipo:** mapa 3D con el DEM de 30 m y un control deslizante con un plano de agua simple, sin conectividad.
- **Fase 2, modelo:** inundación con conectividad, polígonos por nivel y el job de altura en vivo.
- **Fase 3, satélite:** script de Sentinel-1 en Google Earth Engine, capa de agua observada y calibración.
- **Fase 4, mejoras:** DEM de drone, centros de evacuados en el mapa, alertas y acceso compartible para el municipio.

## 9. Preguntas abiertas

- ¿El INA o Prefectura publican la altura en un formato que se pueda leer automáticamente?
- ¿Cuál es la cota del cero del hidrómetro de Paso de la Patria y en qué sistema de alturas está?
- ¿Hay un DEM de 5 m del IGN que cubra Paso de la Patria?
- ¿El municipio tiene un registro de hasta dónde llegó el agua en crecidas anteriores?
- ¿Dónde están las defensas y los terraplenes actuales?

## 10. Principios

- **Transparencia:** mostrar siempre la fuente, la hora del dato y que se trata de una estimación.
- **Pensado para el celular:** liviano, rápido y que se entienda de un vistazo.
- **No competir con lo oficial:** sumar a lo que dicen Prefectura, el municipio y Defensa Civil, y enlazar a esas fuentes.
