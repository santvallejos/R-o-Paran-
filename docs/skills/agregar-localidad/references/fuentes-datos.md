# Fuentes de datos para una localidad

Todas son públicas y sin token. Anotá la URL exacta y la fecha de cada consulta: van a la ficha de
`docs/localidades-nea.md` y al informe.

## Contenido

- [Prefectura Naval: altura, umbrales y nombre del puerto](#prefectura-naval)
- [INA, API a5: estación, cero IGN, series e históricos](#ina-api-a5)
- [Pronóstico oficial](#pronóstico-oficial)
- [OpenStreetMap: casco, barrios y calles](#openstreetmap)
- [DEM Terrarium: verificar cauce, semillas y pelo de agua](#dem-terrarium)
- [Impactos y defensas](#impactos-y-defensas)

## Prefectura Naval

Tabla "Altura de los ríos": https://contenidosweb.prefecturanaval.gob.ar/alturas/

```bash
curl -s https://contenidosweb.prefecturanaval.gob.ar/alturas/ | grep -i -A14 '>GOYA<'
```

Columnas de cada fila: puerto, río, última altura, variación, período (horas entre datos), fecha y hora
(`18/OCT/26 - 2200`), estado (`EVACUACION CRECE`), …, altura anterior, fecha anterior, **alerta**, **evacuación**.

- `puertoPrefectura` es el texto de la primera celda tal cual (mayúsculas, sin acentos: `ITATI`, `PASO DE LA PATRIA`).
- El parser que usa la app está en `supabase/functions/_shared/prefectura.ts`; sus tests
  (`shared/fuentes/prefectura.test.ts`) muestran el formato real de una fila.
- Historial de un puerto: `https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=7&id=<id_externo>`
  (el `id_externo` sale del INA; Itatí = 110).
- La última lectura sirve para el respaldo `public/data/nivel/<id>.json`.

## INA, API a5

Base: `https://alerta.ina.gob.ar/a5`. Responde JSON con `format=json` y permite CORS.

| Qué | Consulta |
|---|---|
| Estaciones de la red de Prefectura (id, nombre, `cero_ign`, coordenadas, `id_externo`, umbrales, `nivel_aguas_bajas`) | `/obs/puntual/estaciones?tabla=alturas_prefe&format=json` |
| Series de una estación | `/obs/puntual/series?estacion_id=<id>&format=json` |
| Serie de altura (variable 2, medición directa) | `/obs/puntual/series?estacion_id=<id>&var_id=2&proc_id=1&format=json` |
| Observaciones de una serie entre fechas | `/obs/puntual/observaciones?series_id=<serie>&timestart=AAAA-MM-DD&timeend=AAAA-MM-DD&format=json` |

- Para las estaciones de Prefectura, **el id de la serie de altura es igual al id de la estación** (verificado en
  todo el catálogo). Ese número va en `ina.serieAltura`.
- `cero_ign` vacío = caso B. La API **no informa el sistema de alturas** del cero (`altitud` viene `null`).
- Coordenadas redondeadas al minuto (marcadas "(≈)" en el catálogo) pueden tener ~1 km de error: confirmalas con OSM
  antes de usarlas para el área.
- **Crecidas históricas**: pedí las observaciones por año (`timestart=1983-01-01&timeend=1983-12-31`) y quedate con el
  máximo y su fecha. Las fechas vienen en UTC. Revisá al menos 1983, 1992, 1998, 2015-16 y 2023; mirá también los
  máximos anuales recientes para saber si la crecida actual ya superó alguna marca.
- Varias lecturas a la misma hora en estaciones vecinas son la base para estimar el cero (ver
  [cota-del-cero.md](cota-del-cero.md)).
- Mapa del INA para orientarse: https://alerta.ina.gob.ar/pub/mapa

## Pronóstico oficial

- SAH-INA: https://www.ina.gob.ar/alerta/ . El "Pronóstico Hidrométrico, río Paraná tramo Argentino" es un PDF
  (`https://www.ina.gob.ar/archivos/alerta/TabProno<AAAAMMDD>.pdf`) que cubre pocos puertos (Corrientes, Barranqueras,
  Goya, Reconquista, La Paz, Paraná, Santa Fe, Rosario). Si la localidad no figura, no hay pronóstico oficial del INA.
- El municipio a veces publica un rango de pico ("entre 7,10 y 7,50 m"); vale como `pronostico` con su fuente.
- La corrida del modelo **estacional** de la API a5 (`/sim/calibrados/499/corridas/last?...`) da medias semanales y
  erró por más de medio metro en Itatí: no la cargues como pronóstico.

## OpenStreetMap

- Nominatim (lugar y límite):
  `https://nominatim.openstreetmap.org/search?q=<Lugar>,<Provincia>&format=json&polygon_geojson=1`.
  El límite suele ser el municipio entero, mucho más grande que el pueblo: usalo para orientarte, no como bbox.
- Overpass (calles y barrios en un recuadro S,O,N,E):

  ```bash
  curl -s https://overpass-api.de/api/interpreter --data-urlencode \
    'data=[out:json][timeout:60];(way[highway](-27.32,-58.31,-27.24,-58.18);node[place~"suburb|neighbourhood|village|town|hamlet|isolated_dwelling|locality"](-27.32,-58.31,-27.24,-58.18););out center;'
  ```

  Los percentiles 2 y 98 de las coordenadas de las calles dan una buena idea del casco.
- Son servicios comunitarios: consultas espaciadas, sin ráfagas, y siempre con
  `-A "mapa-crecida-parana (proyecto informativo sin fines de lucro)"`. Nunca pongas el email ni el nombre del
  usuario en el `User-Agent` ni en otro parámetro, aunque la política de Nominatim sugiera un contacto.

## DEM Terrarium

Tiles públicos (SRTM, pasada del 12/02/2000, ~30 m): `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`.
Es el mismo relieve que usa la app cuando una localidad no tiene relieve procesado.

- Altura de un píxel: `(R · 256 + G + B / 256) − 32768` metros.
- No hace falta escribir un lector: `scripts/dem.mjs` (Node, sin dependencias) da la altura en puntos, grillas y
  transectos, y `scripts/vista-previa.mjs` corre el modelo completo de la localidad (ver el paso 5 de `SKILL.md`).

```bash
S=.claude/skills/agregar-localidad/scripts
node $S/dem.mjs punto <lon> <lat> [<lon> <lat> ...]
node $S/dem.mjs grilla <oeste> <sur> <este> <norte> <paso_grados>
node $S/dem.mjs ns <lon> <lat_norte> <lat_sur> <paso_grados>
node $S/dem.mjs eo <lat> <lon_oeste> <lon_este> <paso_grados>
```

Para qué sirve:

- **Semillas**: sobre el cauce el agua sale plana (el mismo valor en una grilla de puntos vecinos) y más baja que las
  orillas. Muestreá una grilla (p. ej. cada 0,0025°) alrededor del frente del pueblo y elegí puntos en el centro de
  esa franja plana.
- **Bajos y barrancas**: qué partes del área quedan por debajo del pico histórico (`pico + cero`) y cuáles no; con eso
  se decide hasta dónde llevar el bbox.
- **Control del cero**: el pelo de agua del 12/02/2000 contra la lectura del hidrómetro de ese día
  (ver [cota-del-cero.md](cota-del-cero.md)).

El DEM incluye árboles y techos (no es terreno desnudo): en zonas con monte o edificadas, la superficie aparece unos
metros más alta que el suelo.

## Impactos y defensas

No entran en el JSON, pero sirven para validar el modelo y van en la ficha:

- Barrios afectados y evacuados en crecidas anteriores, con la altura del río de ese día (municipio, Defensa Civil,
  medios locales con fecha).
- Defensas, terraplenes o costaneras con su cota de coronamiento. Si existen, se cargan en
  `procesamiento/datos/<id>/defensas.geojson` (propiedades `nombre` y `cota_m`) antes de procesar.
- Centros de evacuados y teléfonos sólo de fuentes oficiales y con la fecha en que se confirmaron.
