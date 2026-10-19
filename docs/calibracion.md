# Calibración del modelo

## La cota del cero del hidrómetro

```
cota_agua (m) = altura_hidrometro (m) + cota_cero (m)
```

Valor actual (en `shared/localidades/paso-de-la-patria.json`, en el modelo y en Supabase): **44,00 m, provisorio**,
estimado con los hidrómetros del INA de Itatí y Corrientes (antes 40,50 m).

### Estimación con los hidrómetros del INA

En la API pública del INA (sin token), Paso de la Patria (estación 18) no tiene cargada la cota del cero
(`cero_ign` vacío), pero sus dos vecinos de Prefectura sí:

| Estación (id) | Coordenadas | Cero IGN | Distancia a Paso (línea recta) |
|---|---|---|---|
| Itatí (17) | −58,244; −27,267 | 45,66 m | 34,2 km |
| Paso de la Patria (18) | — | sin dato | — |
| Corrientes (19) | −58,839; −27,464 | 42,39 m | 29,0 km |

Paso de la Patria queda al ~54 % del tramo Itatí → Corrientes. Se pasa cada lectura a cota absoluta
(`lectura + cero_ign`), se interpola el pelo de agua al 54 % y se le resta la lectura de Paso:

| Fecha | Itatí | Corrientes | Agua interpolada en Paso | Lectura en Paso | Cero resultante |
|---|---|---|---|---|---|
| 18/10/2026 03:00 UTC | 8,06 m → 53,72 m | 6,89 m → 49,28 m | 51,32 m | 7,29 m | **44,03 m** |
| 12/02/2000 (pasada del SRTM) | 3,10 m → 48,76 m | 2,95 m → 45,34 m | 46,91 m | 2,98 m | **43,93 m** |

Las dos fechas, con 26 años y más de 4 m de diferencia de nivel, dan el mismo cero (±0,05 m). Además, el SRTM
registra el pelo de agua frente a Paso de la Patria en ~47 m el 12/02/2000, que coincide con los 46,91 m
interpolados: el sistema de alturas del DEM y el IGN no difieren en más de unos decímetros en esta zona.

Sigue siendo **provisorio** porque supone una pendiente del río uniforme entre Itatí y Corrientes. El dato oficial
del cero de Paso de la Patria (INA, Prefectura o Vías Navegables) lo reemplaza.

### Cómo repetir el cálculo

- Estaciones, con coordenadas y `cero_ign`:
  `https://alerta.ina.gob.ar/a5/obs/puntual/estaciones?tabla=alturas_prefe&format=json`
- Alturas de un día (series 17, 18 y 19 = Itatí, Paso de la Patria y Corrientes):
  `https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=17&timestart=2026-10-18&timeend=2026-10-19&format=json`
  (cambiar `series_id` y las fechas).
- Con las tres lecturas de la misma hora:
  `cero = (h_itati + 45,66) + 0,54 × ((h_corrientes + 42,39) − (h_itati + 45,66)) − h_paso`.

### Antecedente descartado: calibración por edificios (40,5 m, 18/10/2026)

Antes de tener los datos del INA, se bajó el cero a 40,5 m para que el modelo coincidiera con los impactos
informados: con el río entre 7,15 y 7,33 m (17–18/10), Defensa Civil registraba **una sola familia evacuada**
(4 personas) y el municipio preveía hasta 25 familias a reubicar. Esa calibración se apoyaba en el pelo de agua
de Copernicus GLO-30 (45,0 m) y en esas noticias.

Se descarta porque Copernicus **aplana y edita los cuerpos de agua**: su pelo de agua no es una medición del río.
Con el promedio del hidrómetro en 2011–2015 (3,97 m, serie mensual 25496 del INA) y cero 44 m, el agua real habría
estado en ~48 m, unos 3 m por encima de los 45 m del DEM. Además, que haya pocas familias evacuadas no quiere decir
que el agua no llegue a los terrenos: muchas casas de la costa son de fin de semana o están sobreelevadas.

La tabla se conserva como referencia del riesgo que vuelve con 44 m (edificios de Overture Maps, 9.812 en total):

| Cero (m) | Edificios con agua a 7,33 m | A 8,00 m | Pelo de agua del DEM (45 m) en la escala |
|---|---|---|---|
| **44,0** | **4.749** | **5.948** | **1,0 m** |
| 42,0 | 606 | 1.510 | 3,0 m |
| 41,0 | 213 | 467 | 4,0 m |
| 40,5 | 134 | 295 | 4,5 m |
| 40,0 | 101 | 150 | 5,0 m |

### Riesgo: el relieve

Con el cero confirmado por el INA, las cifras altas de edificios alcanzados apuntan a un error en el **relieve**,
no en el cero:

- En tierra, Copernicus corregido queda ~3 m por debajo del SRTM (mediana).
- La corrección por cobertura (`correccionCobertura_m`) resta 2–3 m en zonas urbanas o con monte. Si Copernicus ya
  mide cerca del suelo en esas celdas, la corrección hunde el terreno y el modelo inunda de más.

Hasta resolverlo, el área y los edificios alcanzados son probablemente una **sobreestimación**.

Próximo paso: validar el borde del agua contra imágenes Sentinel-1/2 de estos días (río en ~7,3 m) y revisar
`correccionCobertura_m` (ver "Otros ajustes").

### Al cambiar el cero

1. Actualizar `cota_cero_m` (y `cota_cero_provisoria`) en `localidades` de Supabase: la app lo toma al instante.
   Como migración: ver `supabase/migrations/20261019120000_cero_ina.sql`.
2. Actualizar el JSON de la localidad y `cotaCero_m` en `public/data/relieve/<id>/modelo.json` (es metadato: los PNG
   y `edificios.json` usan cotas absolutas y no hay que regenerarlos).
3. **Las zonas guardadas en Supabase sí dependen del cero**: volver a correr `procesar.py <id> --subir`.

En la app, "Cómo se calcula" permite cambiar el valor en vivo para comparar (o `?cero=` en la URL).

### Otras formas de verificarlo

1. **Dato oficial** (lo mejor): pedir a INA, Prefectura o Vías Navegables la cota del cero del hidrómetro del puerto
   de Paso de la Patria y en qué sistema de alturas está.
2. **Satélite**: elegir una imagen Sentinel-1 con altura conocida, probar valores con `?cero=` y quedarse con el que
   mejor coincida con el borde del agua (también sirve para detectar errores del relieve).
3. **Puntos de control**: fotos con GPS ("acá llegó el agua con 7,20 m") para ajustar fino.

### Crecidas de referencia (serie 18 del INA, Paso de la Patria)

| Año | Pico | Fecha |
|---|---|---|
| 1983 | 9,54 m | 21/06/1983 |
| 1998 | 8,69 m | 04/05/1998 |
| 2016 | 7,78 m | 11/01/2016 |
| 2023 | 7,44 m | 10/11/2023 |

## Umbrales oficiales

Prefectura publica para Paso de la Patria **alerta 6,50 m y evacuación 7,00 m**. La Edge Function los mantiene
al día en `localidades.umbrales`.

## Otros ajustes

- `semillasRio`: deben caer dentro del cauce en el DEM. Si quedan en tierra, el modelo inunda de más.
- Defensas y terraplenes: cargarlos en la tabla `defensas` (o en `procesamiento/datos/<id>/defensas.geojson`) y reprocesar.
  Se rasterizan como barreras.
- Corrección por cobertura (`correccionCobertura_m`): hoy árboles 3 m, arbustos 1 m, edificado 2 m. Con puntos de
  control se puede ajustar.
