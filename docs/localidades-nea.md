# Localidades del NEA

Catálogo de localidades ribereñas del NEA (Corrientes, Chaco, Formosa y Misiones) con hidrómetro de Prefectura, y
ficha del próximo piloto, **Itatí**. Datos relevados el **18/10/2026**. Cada valor lleva su fuente; lo que no se pudo
obtener figura como **FALTANTE**.

## Fuentes

| Sigla | Fuente | URL |
|---|---|---|
| INA-E | INA, API a5: estaciones de la red de Prefectura (`alturas_prefe`) | https://alerta.ina.gob.ar/a5/obs/puntual/estaciones?tabla=alturas_prefe&format=json |
| INA-S | INA, API a5: series de una estación | https://alerta.ina.gob.ar/a5/obs/puntual/series?estacion_id=17&format=json |
| INA-O | INA, API a5: observaciones de una serie | https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=17&timestart=AAAA-MM-DD&timeend=AAAA-MM-DD&format=json |
| INA-P | INA, API a5: última corrida del modelo estacional (calibrado 499) | https://alerta.ina.gob.ar/a5/sim/calibrados/499/corridas/last?estacion_id=17&series_id=34861&includeProno=true&format=json |
| SAH | INA, Sistema de Alerta Hidrológico (portada, pronóstico, informe semanal) | https://www.ina.gob.ar/alerta/ |
| PNA | Prefectura Naval, Altura de los ríos (tabla del 18/10/2026, 22:00) | https://contenidosweb.prefecturanaval.gob.ar/alturas/ |
| PNA-H | Prefectura Naval, historial de Itatí | https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=7&id=110 |
| OSM | OpenStreetMap (Nominatim y Overpass) | https://nominatim.openstreetmap.org/search?q=Itati,Corrientes&format=json&polygon_geojson=1 |
| DEM | Terrarium (SRTM, pasada de febrero de 2000), z14 | https://s3.amazonaws.com/elevation-tiles-prod/terrarium/14/{x}/{y}.png |

## Catálogo NEA

En la API del INA, para las estaciones de Prefectura, **el id de la serie de altura (variable H, medición directa)
coincide con el id de la estación**. Se verificó con `series?estacion_id=<id>&var_id=2&proc_id=1` en todas las filas.
El `id_externo` del INA es el `id` del historial de Prefectura (por ejemplo, Itatí = 110).

- **Puerto PNA**: nombre exacto en la columna "Puerto" de la tabla de Prefectura.
- **Cero IGN**: campo `cero_ign` de INA-E. Ninguna estación trae el sistema de referencia vertical (`altitud` también
  está vacío).
- **Coordenadas**: las de INA-E. "(≈)" marca coordenadas redondeadas al minuto de arco (hasta ~1 km de error); antes de
  usarlas para el modelo hay que confirmarlas.
- **Alerta / evacuación**: tabla de Prefectura (PNA). Las del INA coinciden salvo en Puerto Concepción (INA: 15,5 / 16,5)
  y en las estaciones del río Uruguay en Misiones, donde el INA no tiene umbrales.
- **Estado**: "activa" = ya está en la app; "piloto" = la próxima en cargar; "catálogo" = candidata.

| Localidad | Provincia | Río | Puerto PNA | Estación / serie INA | Cero IGN (m) | Coordenadas (lon; lat) | Alerta / evacuación (m) | Estado |
|---|---|---|---|---|---|---|---|---|
| Andresito | Misiones | Iguazú | ANDRESITO | 8 / 8 | FALTANTE | −53,9833; −25,5833 (≈) | 10,50 / 13,50 | catálogo |
| Puerto Iguazú | Misiones | Iguazú (PNA) / Paraná (INA) | IGUAZU | 9 / 9 | FALTANTE | −54,5667; −25,5833 (≈) | 25,00 / 28,00 | catálogo |
| Libertad | Misiones | Paraná | LIBERTAD | 10 / 10 | FALTANTE | −54,6211; −25,9167 (≈) | 29,00 / 31,00 | catálogo |
| El Dorado | Misiones | Paraná | ELDORADO | 11 / 11 | FALTANTE | −54,7; −26,3833 (≈) | 23,00 / 25,00 | catálogo |
| Libertador | Misiones | Paraná | LIBERTADOR | 12 / 12 | FALTANTE | −55,0333; −26,8 (≈) | 14,50 / 15,50 | catálogo |
| Puerto Maní | Misiones | Paraná | PUERTO MANI | 131 / 131 | FALTANTE | −55,5222; −27,1064 | 9,50 / 10,00 | catálogo |
| Santa Ana | Misiones | Paraná | SANTA ANA | 13 / 13 | FALTANTE | −55,5884; −27,3351 | 9,30 / 9,80 | catálogo |
| Posadas | Misiones | Paraná | POSADAS | 14 / 14 | FALTANTE | −55,8833; −27,3667 (≈) | 11,00 / 12,00 | catálogo |
| Ituzaingó | Corrientes | Paraná | ITUZAINGO | 15 / 15 | FALTANTE | −56,7; −27,5833 (≈) | 3,50 / 4,00 | catálogo |
| Itá Ibaté | Corrientes | Paraná | ITA IBATE | 16 / 16 | 52,42 | −57,3333; −27,4234 (≈) | 7,00 / 7,50 | catálogo |
| **Itatí** | Corrientes | Paraná | **ITATI** | **17 / 17** | **45,66** | **−58,2441; −27,2668** | **6,80 / 7,50** | **piloto** |
| Paso de la Patria | Corrientes | Paraná | PASO DE LA PATRIA | 18 / 18 | FALTANTE (44,0 provisorio, ver `calibracion.md`) | −58,5833; −27,3333 (≈) | 6,50 / 7,00 | activa |
| Corrientes | Corrientes | Paraná | CORRIENTES | 19 / 19 | 42,39 | −58,8389; −27,4636 | 6,50 / 7,00 | catálogo |
| Empedrado | Corrientes | Paraná | EMPEDRADO | 21 / 21 | 39,68 | −58,8185; −27,9541 | 6,50 / 7,00 | catálogo |
| Bella Vista | Corrientes | Paraná | BELLA VISTA | 22 / 22 | 34,74 | −59,0593; −28,5184 | 6,00 / 6,40 | catálogo |
| Goya | Corrientes | Paraná | GOYA | 23 / 23 | 29,67 | −59,273; −29,1438 | 5,20 / 5,70 | catálogo |
| Esquina | Corrientes | Paraná | ESQUINA | 25 / 25 | 22,03 | −59,5366; −30,0192 | 5,00 / 5,40 | catálogo |
| Barranqueras | Chaco | Paraná (riacho Barranqueras) | BARRANQUERAS | 20 / 20 | FALTANTE | −58,9333; −27,4833 (≈) | 6,00 / 6,50 | catálogo |
| Isla del Cerrito | Chaco | Paraguay | ISLA DEL CERRITO | 59 / 59 | FALTANTE | −58,6167; −27,3167 (≈) | 6,20 / 6,80 | catálogo |
| Las Palmas | Chaco | Paraguay | LAS PALMAS | FALTANTE (no está en INA-E) | FALTANTE | FALTANTE | 6,50 / 7,00 | catálogo |
| Puerto Pilcomayo | Formosa | Paraguay | PILCOMAYO | 55 / 55 | FALTANTE | −57,65; −25,3667 (≈) | 5,35 / 6,00 | catálogo |
| Bouvier | Formosa | Paraguay | BOUVIER | 56 / 56 (datos hasta 30/01/2024) | FALTANTE | −57,5682; −25,4519 | 6,00 / 6,40 | catálogo |
| Puerto Formosa | Formosa | Paraguay | FORMOSA | 57 / 57 | FALTANTE | −58,1833; −26,1833 (≈) | 7,80 / 8,30 | catálogo |
| Bermejo | Formosa (según INA) | Paraguay | BERMEJO | 58 / 58 | FALTANTE | −58,5062; −26,9263 | 6,50 / 7,00 | catálogo |
| Pepirí Miní | Misiones | Uruguay | FALTANTE (no figura en PNA) | 60 / 60 | FALTANTE | −53,9331; −27,1537 | FALTANTE | catálogo |
| El Soberbio | Misiones | Uruguay | EL SOBERBIO | 61 / 61 | FALTANTE | −54,2; −27,3 (≈) | 11,00 / 13,00 | catálogo |
| Alicia | Misiones | Uruguay | FALTANTE (no figura en PNA) | 62 / 62 (datos hasta 08/02/2022) | FALTANTE | −54,3553; −27,4375 | FALTANTE | catálogo |
| Alba Posse | Misiones | Uruguay | ALBA POSSE | 63 / 63 | FALTANTE | −54,6785; −27,572 | 8,00 / 12,00 | catálogo |
| Panambí | Misiones | Uruguay | PANAMBI | 64 / 64 | FALTANTE | −54,913; −27,7306 | 7,00 / 9,00 | catálogo |
| San Javier | Misiones | Uruguay | SAN JAVIER | 65 / 65 | FALTANTE | −55,1333; −27,8833 (≈) | 8,00 / 10,00 | catálogo |
| Puerto Concepción | Misiones | Uruguay | PUERTO CONCEPCION | 66 / 66 | FALTANTE | −55,5814; −28,1192 | 16,50 / 17,50 | catálogo |
| Garruchos | Corrientes | Uruguay | GARRUCHOS | 67 / 67 | FALTANTE | −55,65; −28,1833 (≈) | 12,00 / 14,00 | catálogo |
| Santo Tomé | Corrientes | Uruguay | SANTO TOME | 68 / 68 | FALTANTE | −56,0333; −28,55 (≈) | 11,50 / 12,50 | catálogo |
| Alvear | Corrientes | Uruguay | ALVEAR | 69 / 69 | FALTANTE | −56,55; −29,1 (≈) | 9,50 / 11,00 | catálogo |
| La Cruz | Corrientes | Uruguay | LA CRUZ | 70 / 70 | FALTANTE | −56,634; −29,1806 | 9,50 / 11,50 | catálogo |
| Yapeyú | Corrientes | Uruguay | YAPEYU | 71 / 71 | FALTANTE | −56,8107; −29,47 | 9,50 / 10,50 | catálogo |
| Paso de los Libres | Corrientes | Uruguay | PASO DE LOS LIBRES | 72 / 72 | FALTANTE | −57,0833; −29,7167 (≈) | 7,50 / 8,50 | catálogo |
| Bompland | Corrientes | Uruguay | BOMPLAND | 73 / 73 | FALTANTE | −57,3329; −29,8727 | 7,90 / 10,80 | catálogo |
| Monte Caseros | Corrientes | Uruguay | MONTE CASEROS | 74 / 74 | FALTANTE | −57,6333; −30,25 (≈) | 7,50 / 8,50 | catálogo |
| Mocoretá | Corrientes | Uruguay | MOCORETA | 75 / 75 | FALTANTE | −57,8178; −30,7157 | 10,30 / 12,00 | catálogo |

Notas del catálogo:

- Sólo 7 estaciones del NEA tienen `cero_ign` en el INA, todas sobre el Paraná en Corrientes (Itá Ibaté, Itatí,
  Corrientes, Empedrado, Bella Vista, Goya, Esquina). Son las candidatas más directas después de Itatí; para las demás
  habría que estimar el cero como se hizo con Paso de la Patria.
- Bermejo: el INA la ubica en Formosa, pero las coordenadas (−58,51; −26,93) caen frente a Puerto Bermejo (Chaco), en la
  desembocadura del Bermejo en el Paraguay. Confirmar con Prefectura antes de usarla.
- Barranqueras: el INA le asigna el río "BARRANQUERAS" (riacho) y Prefectura, "PARANA".
- No se incluyen "Yacyretá afluente/efluente" (ids 87 y 88): son puntos de la represa y no tienen datos de altura.
- La columna "Periodo" de Prefectura indica cada cuántas horas llega el dato. Cada 2 h: Puerto Iguazú, Libertad,
  Eldorado, Libertador, Santa Ana, Ituzaingó, Itatí, Paso de la Patria, Corrientes, Goya, Barranqueras, Las Palmas, Isla del
  Cerrito, Alvear, La Cruz, Yapeyú, Paso de los Libres y Bompland. Puerto Concepción, cada 24 h. El resto, cada 12 h.

## Itatí (piloto)

### Hidrómetro

| Dato | Valor | Fuente |
|---|---|---|
| Estación INA | id 17, "Itatí", `id_externo` 110, río PARANAMED, propietario PNA, `abreviatura` ITATI | INA-E, INA-S |
| Serie de altura | **17** (variable 2 "Altura hidrométrica", medición directa, m), del 02/01/1912 al 18/10/2026, 41.313 datos | INA-S |
| Otras series | 26259 media diaria (1912–2026), 25495 media mensual (1970–2026), 35319 media semanal (2023–2026), 866 caudal (2015–2021) | INA-S |
| Coordenadas | −58,24407387; −27,26677773 | INA-S |
| Cero IGN | **45,66 m** | INA-E (`cero_ign`) |
| Sistema de referencia del cero | **FALTANTE**: la API no lo informa (`altitud` = null) | INA-E |
| Alerta / evacuación | 6,80 m / 7,50 m (iguales en INA y Prefectura) | PNA, INA-E |
| Aguas bajas | 2,70 m | INA-E (`nivel_aguas_bajas`) |
| Puerto en Prefectura | `ITATI` (historial id 110) | PNA |

**Control del cero con el relieve.** El 12/02/2000 (pasada del SRTM) el hidrómetro marcaba 3,10 m (INA-O), o sea agua
a 3,10 + 45,66 = 48,76 m. En el DEM Terrarium el pelo de agua frente a Itatí es plano en **48,0 m** (DEM). La
diferencia es de −0,76 m: el DEM queda unos 0,8 m por debajo del sistema del IGN en esta zona, el mismo orden que en Paso
de la Patria (`calibracion.md`). No es un error del cero, pero conviene tenerlo en cuenta al calibrar.

### Situación actual (18/10/2026)

| Dato | Valor | Fuente |
|---|---|---|
| Última altura Prefectura | **8,17 m**, 18/OCT/26 22:00 | PNA |
| Variación | +0,02 m en 2 h (anterior 8,15 m, 18/OCT/26 20:00) | PNA |
| Estado | EVACUACION CRECE | PNA |
| Última lectura en el INA | 8,06 m, 2026-10-18T03:00Z (dato diario; actualizado 18/10 16:30Z) | INA-O |
| Cota del agua | 8,17 + 45,66 = **53,83 m** | cálculo |
| Subida en octubre | 4,68 m (01/10) → 6,68 m (15/10) → 7,78 m (17/10) → 8,06 m (18/10) | INA-O |

Con 8,17 m el río **ya superó el pico de 2023 (8,07 m)** y es la marca más alta en Itatí desde mayo de 1998 (8,95 m):
entre 1999 y 2025 ningún año pasó de 8,07 m (INA-O, máximos anuales de la serie 17).

### Crecidas de referencia (serie 17)

| Crecida | Pico | Fecha | Nota |
|---|---|---|---|
| 1983 | **10,13 m** | 17/07/1983 | Hubo dos picos: 9,99 m el 21/06 y 10,13 m el 17/07. En Paso de la Patria el mayor fue el de junio (9,54 m), por eso las fechas no coinciden. |
| 1998 | **8,95 m** | 03/05/1998 | |
| 2015-16 | **7,92 m** | 20/12/2015 | Misma crecida (El Niño 2015-16). En el año calendario 2016 el máximo fue 7,76 m (09/03/2016); en enero de 2016 llegó a 7,64 m. |
| 2023 | **8,07 m** | 09/11/2023 | |

Otros picos de la serie: 1992 9,31 m (07/06), 1990 8,86 m (31/01), 1997 8,58 m (09/02), 1982 8,27 m (10/12), 2013
8,05 m (02/07).

**Estiaje reciente:** mínimo de **0,70 m** entre el 10 y el 15/07/2021 (0,74 m el 23/02/2022; 1,10 m el 24/04/2025)
(INA-O).

La API devuelve datos desde 1912, así que no hay huecos para estas crecidas. Las fechas son las de `timestart` en UTC
(09:00Z en 1983, 07:00Z en 1998-2015 y 03:00Z desde 2016).

### Pronóstico

- **SAH-INA: FALTANTE.** El "Pronóstico Hidrométrico, río Paraná tramo Argentino" vigente (emitido el 16/10/2026,
  próximo el 20/10/2026, https://www.ina.gob.ar/archivos/alerta/TabProno20261016.pdf) sólo cubre Corrientes,
  Barranqueras, Goya, Reconquista, La Paz, Paraná, Santa Fe y Rosario. Para Corrientes da 7,29 m (7,00–7,80) el 20/10
  y 6,25 m (5,80–6,60) el 27/10. El informe semanal del 14/10 tampoco menciona a Itatí.
- La API tiene una corrida del modelo **estacional** "parana_estacional_sissa" (calibrado 499, serie 34861, medias
  semanales, emitida el 16/10/2026) (INA-P). Para el 18/10 daba 7,49 m (p10 7,11; p90 7,87), por debajo de lo observado
  (8,06–8,17 m), y para el 25/10 4,14 m. **No sirve como pronóstico de corto plazo**: no cargarlo en la app.

### Impactos, defensas y evacuados

| Dato | Valor | Fuente |
|---|---|---|
| Barrio más expuesto | **Ibiray** (OSM: −58,2557; −27,2733). También la costanera, los paradores y los campings | Misiones Online, 05/08/2026; Perfil, 15/10/2026 |
| Con 6,80 m (15/10/2026) | El agua cubrió toda la costanera y entró en las partes más bajas de Ibiray | Perfil, 15/10/2026 |
| Evacuados (15/10/2026) | 14 personas de 5 familias, alojadas en la Casa Promesera y el hospedaje Taba Cué | Canal 12 Misiones, 15/10/2026 |
| Evacuados a 8,17 m (18/10/2026) | **FALTANTE** | — |
| Previsión municipal | Unas 100 familias afectadas si crece el Paraná | Misiones Online, 05/08/2026 (fuente: Diario Época) |
| Crecida de 2023 (8,07 m) | Más de 1.200 evacuados; las 220 casas de Ibiray quedaron bajo agua y fueron evacuadas; 25 familias aisladas | Misiones Online, 11/11/2023 (Télam) |
| Albergues usados en 2023 | Hospedaje del Promesero de la Basílica, dos albergues municipales y el Club de Pesca y Canotaje | Misiones Online, 11/11/2023 |
| Defensas o terraplenes | **FALTANTE**: no se encontró información pública de defensas costeras en Itatí | búsqueda web |

La nota de agosto de 2026 dice que en "la crecida registrada en 2022" se evacuó a más de cien familias. Según el INA, el
pico de 2022 fue de 5,45 m, por debajo de la alerta, así que probablemente se refiera a la de 2023. Conviene confirmarlo
con el municipio.

URLs:

- Perfil, 15/10/2026: https://www.perfil.com/noticias/nea/crecida-del-rio-parana-los-cuatro-municipios-de-corrientes-que-estan-en-alerta-por-niveles-de-evacuacion.phtml
- Canal 12 Misiones, 15/10/2026: https://www.canal12misiones.com/aaa-modulo-b/corrientes-108-evacuados-crecida-del-parana
- Misiones Online, 05/08/2026: https://misionesonline.net/2026/08/05/corrientes-el-nino-crecida-parana/
- Misiones Online, 11/11/2023: https://misionesonline.net/2023/11/11/con-mas-de-1200-evacuados-itati-es-la-localidad-correntina-mas-afectada-por-las-inundaciones/

### Geografía y área del modelo

Lo que se pudo verificar:

- **Pueblo** (OSM): nodo `place=village` "Itatí" en −58,2428; −27,2690. El límite de Nominatim es el municipio entero
  (−58,362 a −57,742; −27,444 a −27,261), mucho más grande que el pueblo. Barrios en OSM: Ibiray (−58,2557; −27,2733) y
  Abá Rapé (−58,2342; −27,2730).
- **Calles** (OSM, Overpass): entre los percentiles 2 y 98 ocupan lon −58,268 a −58,222 y lat −27,297 a −27,265.
- **Accesos** (OSM): la RP 20 (Av. 25 de Mayo en el pueblo) baja de −27,275 a −27,348 y empalma con la **RN 12** en
  ≈ −58,235; −27,349, unos 8 km al sur del pueblo. La RN 12 corre entre −27,32 y −27,37.
- **Cauce** (DEM): frente al pueblo, el agua plana a 48,0 m ocupa lat −27,2475 a −27,265 en lon −58,245, unos 1,9 km de
  ancho. Al norte del cauce hay tierra paraguaya o islas (52–60 m). Según OSM, el límite internacional pasa cerca de la
  costa argentina: los puntos de agua a −27,258 o más al norte caen en Paraguay.
- **Relieve** (DEM, que incluye vegetación y edificios): el casco está sobre una barranca de 57–69 m, por encima del
  pico de 1983 (10,13 + 45,66 = 55,79 m). Hay zonas bajas de 47–52 m al oeste (−58,30 a −58,27; −27,265 a −27,28), al
  este (−58,23 a −58,19; −27,265 a −27,285) y en la franja costera. La meseta al sur de −27,285 está entre 60 y 70 m,
  así que la RN 12 y casi toda la RP 20 no se inundan.

Propuesta:

| Campo | Valor | Justificación |
|---|---|---|
| `bbox` [O, S, E, N] | **[−58.30, −27.305, −58.19, −27.245]** | 0,11° × 0,06°, igual que Paso. Cubre el casco, la costanera, Ibiray, Abá Rapé, las zonas bajas del este y del oeste, el tramo norte de la RP 20 y el cauce hasta la otra orilla. |
| `centro` [lon, lat] | **[−58.245, −27.275]** | Centro del bbox. Cae en el casco, a ~700 m del nodo OSM. |
| `zoom` | **13.4** | Mismo ancho de bbox que Paso (13,4). |
| `semillasRio` | **[−58.245, −27.256]** y **[−58.275, −27.256]** | Las dos dan 48,0 m en el DEM, en el centro del cauce, frente al hidrómetro y 3 km aguas abajo. Con la grilla de 0,0025° todo el tramo de lat −27,2525 a −27,2575 es agua entre lon −58,30 y −58,23. |

El empalme con la RN 12 queda unos 4,5 km al sur del bbox. Para incluirlo habría que llevar el borde sur a −27,355
(0,11° × 0,11°, casi el doble de área). No se recomienda: ese tramo está en la meseta (>60 m) y no se inunda con ninguna
crecida registrada.

### Rango del simulador

- `simulador`: **5,00 a 10,20 m**, de a 0,05 m. El mínimo queda 1,8 m por debajo de la alerta (en Paso, 1,5 m). El máximo
  cubre el pico de 1983 (10,13 m).
- `procesamiento.nivelesZonas_m`: **desde 5,0, hasta 10,2, paso 0,1** (53 niveles; en Paso son 47).

## Datos faltantes

1. Sistema de referencia vertical del cero IGN de Itatí (y de todas las estaciones).
2. Pronóstico oficial de corto plazo para Itatí: el SAH no lo publica. Como referencia se puede usar el de Corrientes.
3. Evacuados y barrios afectados con la altura actual (8,17 m).
4. Defensas, terraplenes o cotas de la costanera de Itatí. Hay que pedírselos al municipio o a Defensa Civil de
   Corrientes.
5. Lista oficial y ubicación de los centros de evacuados. Sólo se conocen los de 2023 y la Casa Promesera y Taba Cué
   (2026), sin coordenadas.
6. Cero IGN de 33 de las 40 estaciones del catálogo. Las Palmas (Chaco) no está en el INA: faltan su id, sus
   coordenadas y su cero.
7. Coordenadas precisas para las estaciones marcadas con "(≈)".
