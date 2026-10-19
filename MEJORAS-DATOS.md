# Mejoras de datos para la estimación

La app calcula qué se inunda con tres datos: **la altura del río** (Prefectura), **la cota del cero del
hidrómetro** (convierte esa altura en metros sobre el nivel del mar) y **el relieve** (DEM). Si uno de los tres
tiene error, el mapa también lo tiene. Hoy la mayor incertidumbre está en el cero y en el relieve, no en la altura.

Este documento lista qué datos faltan, por qué importan, de dónde sacarlos y cómo cargarlos. El orden es de mayor a
menor impacto.

## Resumen

| # | Mejora | Localidad | Impacto | Fuente | Estado |
|---|---|---|---|---|---|
| 1 | Cota oficial del cero del hidrómetro | Paso de la Patria | Muy alto | INA / Prefectura / IGN | Provisoria (44,0 m interpolada) |
| 2 | Sistema de alturas del cero IGN | Itatí (y el resto) | Alto | INA / IGN | Diferencia de ~0,8 m sin explicar |
| 3 | Relieve más preciso que Copernicus 30 m | Todas | Muy alto | IGN (MDE-Ar), FABDEM, drone | Copernicus corregido |
| 4 | Defensas, terraplenes y costaneras | Todas | Alto | Municipios, DPV Corrientes | Tabla vacía |
| 5 | Validación con imágenes satelitales de la crecida | Todas | Alto (mide el error) | Sentinel-1 / Sentinel-2 | Sin hacer |
| 6 | Calibrar la corrección por cobertura | Todas | Medio | Resultado de 5 | Valores fijos por clase |
| 7 | Observaciones de campo con fecha y altura | Todas | Medio | Vecinos, municipio, medios | Sin cargar |
| 8 | Pronóstico de corto plazo | Itatí | Medio (informativo) | INA (SAH) | Faltante |
| 9 | Centros de evacuados y teléfonos | Todas | Alto para la gente | Municipios, Defensa Civil | Faltante |
| 10 | Datos faltantes del catálogo NEA | NEA | Para sumar localidades | INA, Prefectura | Ver `docs/localidades-nea.md` |

## 1. Cota oficial del cero en Paso de la Patria

**Problema.** El INA no publica el cero IGN de la estación Paso de la Patria (serie 18, campo `cero_ign` vacío).
Hoy se usan 44,0 m, interpolados entre Itatí (45,66 m) y Corrientes (42,39 m) según la pendiente del río. Un error
de 0,5 m en el cero equivale a que el río esté 0,5 m más alto o más bajo en toda la simulación.

**Qué pedir.** La cota IGN del cero del hidrómetro del puerto de Paso de la Patria, con el sistema de referencia
vertical. Se puede pedir al INA (Sistema de Alerta Hidrológico), a Prefectura Naval (División Hidrografía) o al IGN.
Otra opción es una nivelación con GPS diferencial del hidrómetro, que puede hacer un agrimensor.

**Cómo cargarlo.**
1. Antes de cambiar nada, probarlo en la app con `?localidad=paso-de-la-patria&cero=<valor>`.
2. Cambiar `hidrometro.cotaCero_m` y poner `cotaCeroProvisoria: false` en `shared/localidades/paso-de-la-patria.json`.
3. Generar la migración con `node scripts/sql-localidad.ts paso-de-la-patria` y aplicarla en Supabase.
4. Actualizar `docs/calibracion.md`.

## 2. Sistema de alturas del cero IGN (Itatí y el resto)

**Problema.** El INA publica el cero de Itatí (45,66 m) sin decir en qué sistema está. Al compararlo con el relieve,
el agua del río queda unos 0,76 m por encima del DEM: el 12/02/2000 el hidrómetro marcaba 3,10 m y el agua del DEM
frente a Itatí estaba a 48,0 m. Puede ser una diferencia de datum (sistema IGN histórico contra EGM2008, que usa
Copernicus) o un error del DEM sobre el agua.

**Qué pedir.** Al INA o al IGN, en qué sistema de alturas están los `cero_ign` de la red de Prefectura y cómo
pasarlos a EGM2008.

**Cómo cargarlo.** Si se confirma una diferencia sistemática, corregir `cotaCero_m` de cada localidad con esa
diferencia y documentarlo en `docs/calibracion.md`. La capa de la app no necesita reprocesarse, porque usa cotas
absolutas. Las zonas de Supabase sí: hay que correr `procesar.py <id> --subir`.

## 3. Relieve más preciso

**Problema.** Copernicus GLO-30 tiene celdas de unos 30 m y mide la superficie, incluidos árboles y techos. La
corrección por cobertura le resta valores fijos por clase. En Paso, el relieve corregido queda unos 3 m por debajo de
SRTM en tierra, y es probable que el modelo **sobreestime** el área inundada y los edificios alcanzados.

**Opciones, de mejor a más simple:**
- **Vuelo con drone** (fotogrametría o LiDAR) del casco urbano y la costa: centímetros de precisión. Es la mejor
  opción para Itatí, que es chica.
- **MDE-Ar del IGN** (5 m, terreno desnudo): pedir los mosaicos de la zona y verificar su datum.
- **FABDEM** (30 m, sin árboles ni edificios): reemplaza la corrección por cobertura.

**Cómo cargarlo.** `python procesamiento/procesar.py <id> --dem <archivo.tif> --nombre-dem "<fuente>"`. Para FABDEM
agregar `--sin-correccion-cobertura`. Ver `docs/procesamiento.md`.

## 4. Defensas, terraplenes y costaneras

**Problema.** El modelo inunda todo lo que está por debajo de la cota del agua y conectado al río. Si hay un
terraplén o una defensa costera que no está cargada, el modelo inunda de más lo que hay detrás.

**Qué conseguir.** El trazado (línea) y la cota de coronamiento de cada defensa: costanera de Itatí, terraplenes de
Paso de la Patria y rutas o caminos elevados que funcionen como barrera. Fuentes: municipios, Dirección Provincial de
Vialidad de Corrientes, INA, o un relevamiento propio con GPS.

**Cómo cargarlo.** Hay dos maneras:
- un GeoJSON en `procesamiento/datos/<id>/defensas.geojson`, con las propiedades `nombre` y `cota_m`;
- filas en la tabla `defensas` de Supabase.

Después, reprocesar con `procesar.py <id>`.

## 5. Validación con imágenes satelitales de esta crecida

**Problema.** Hoy no hay una medida del error del modelo. La crecida de octubre de 2026 es la oportunidad de medirlo.

**Qué hacer.**
- Sentinel-1 (radar): ve el agua aunque esté nublado. Pasa cada 6 a 12 días.
- Sentinel-2 (óptico): sirve cuando no hay nubes.
- Para cada imagen, sacar la mancha de agua, anotar la altura del hidrómetro a esa hora y compararla con el modelo
  para esa altura (IoU, área de más y área de menos).

Se puede hacer con un script de Google Earth Engine que exporte el GeoJSON del agua observada.

**Para qué sirve.** Muestra si el modelo inunda de más o de menos, y dónde. Con eso se ajustan el cero (punto 2) y
la corrección por cobertura (punto 6).

## 6. Calibrar la corrección por cobertura

**Problema.** `procesamiento.correccionCobertura_m` resta 3 m en árboles, 1 m en arbustos y 2 m en zonas edificadas.
Son valores genéricos, no medidos en la zona.

**Cómo mejorarlo.** Con la validación del punto 5, o con puntos de terreno conocidos (marcas de agua, cotas de
calles), probar otros valores en el JSON de la localidad, reprocesar y comparar. Quedarse con los que más se
acerquen a lo observado.

## 7. Observaciones de campo

**Qué sirve.** Fotos o reportes con lugar, fecha y hora en los que se vea hasta dónde llegó el agua. Por ejemplo:
"el agua llegó a la esquina de X y Y el 15/10 a las 18 h". Con la altura del hidrómetro de esa hora, cada
observación es un punto de control del modelo.

**Fuentes.** Municipio, Defensa Civil, medios locales, vecinos.

**Cómo cargarlo.** Tabla `puntos_control` de Supabase. Ya existe en el esquema inicial.

## 8. Pronóstico de corto plazo para Itatí

El informe del SAH-INA no incluye Itatí (sí Corrientes). El modelo estacional de la API a5 para Itatí daba 7,49 m
cuando lo observado fue 8,06–8,17 m, así que no sirve. Pedir al INA si existe un pronóstico para el puerto, o cargar
el que publique el municipio en el campo `pronostico` del JSON de la localidad.

## 9. Centros de evacuados y teléfonos útiles

No mejora la estimación, pero es lo primero que busca la gente durante una crecida. Hace falta, por localidad:
- ubicación y nombre de cada centro de evacuados;
- teléfonos de Defensa Civil, municipio, Prefectura y emergencias.

Tienen que salir de fuentes oficiales (municipio, Defensa Civil de Corrientes) y llevar la fecha en que se
confirmaron.

Lo conocido hasta ahora en Itatí: en octubre de 2026 se usaron la Casa Promesera y el hospedaje Taba Cué, pero no
tenemos sus coordenadas.

## 10. Datos faltantes para sumar localidades del NEA

Está detallado en `docs/localidades-nea.md`:
- **Cero IGN** de 33 de las 40 estaciones. Hoy lo tienen Itá Ibaté, Itatí, Corrientes, Empedrado, Bella Vista,
  Goya y Esquina, que son las más fáciles de sumar.
- **Las Palmas (Chaco):** aparece en Prefectura pero no en el INA.
- **Coordenadas redondeadas** de muchas estaciones, que hay que confirmar.
- **Barranqueras/Resistencia y Formosa:** necesitan revisar si alcanza un solo río y un solo cero por localidad.
