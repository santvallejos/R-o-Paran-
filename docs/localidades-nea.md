# Localidades del NEA y del Bajo Paraná

Catálogo de localidades ribereñas del NEA (Corrientes, Chaco, Formosa y Misiones) con hidrómetro de Prefectura, y
fichas de las localidades cargadas: **Itatí** (relevada el **18/10/2026**), **Ituzaingó** y, fuera del NEA, **Campana**
y **Zárate** en el Bajo Paraná (relevadas el **21/10/2026**), y **Corrientes** capital (relevada el **22/10/2026**).
Cada valor lleva su fuente; lo que no se pudo
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
- **Alerta / evacuación**: tabla de Prefectura (PNA). Las del INA coinciden salvo en Puerto Concepción (INA: 15,5 / 16,5),
  en Zárate (INA: 2,00 / 2,20) y en las estaciones del río Uruguay en Misiones, donde el INA no tiene umbrales.
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
| **Ituzaingó** | Corrientes | Paraná | **ITUZAINGO** | **15 / 15** | FALTANTE (58,3 provisorio, ver ficha) | −56,7; −27,5833 (≈; muelle de Prefectura en −56,6938; −27,5855 según OSM) | 3,50 / 4,00 | **activa** |
| Itá Ibaté | Corrientes | Paraná | ITA IBATE | 16 / 16 | 52,42 | −57,3333; −27,4234 (≈) | 7,00 / 7,50 | catálogo |
| **Itatí** | Corrientes | Paraná | **ITATI** | **17 / 17** | **45,66** | **−58,2441; −27,2668** | **6,80 / 7,50** | **piloto** |
| Paso de la Patria | Corrientes | Paraná | PASO DE LA PATRIA | 18 / 18 | FALTANTE (44,0 provisorio, ver `calibracion.md`) | −58,5833; −27,3333 (≈) | 6,50 / 7,00 | activa |
| **Corrientes** | Corrientes | Paraná | **CORRIENTES** | **19 / 19** | **42,39** | **−58,8389; −27,4636** | **6,50 / 7,00** | **activa** |
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

## Datos faltantes (Itatí y catálogo NEA)

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

## Ituzaingó

Datos relevados el **21/10/2026**. Caso **B** (puerto de Prefectura sin `cero_ign` en el INA). Fuentes nuevas además de
las de la tabla general:

| Sigla | Fuente | URL |
|---|---|---|
| PNA-H15 | Prefectura Naval, historial de Ituzaingó | https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=7&id=90 |
| INA-O15 | INA, API a5: observaciones de las series 15, 16 y 17 (1910–2026) | https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=15&timestart=1900-01-01&timeend=2026-10-22&format=json |
| EBY-IH | Entidad Binacional Yacyretá, informe hidrológico (alertas del 16 y 19/10/2026) | https://www.eby.org.ar/informe-hidrologico |
| EBY-RE | EBY, Resumen Ejecutivo N° 6115 (18/10/2026) | https://www.eby.gov.py/cota-82-90-msnm-resumen-ejecutivo-n-6115-18-10-2026/ |
| EBY-CH | EBY, complejo hidroeléctrico (salto de diseño, cotas de vertederos) | https://www.eby.org.ar/complejo-hidroelectrico |
| OSM-I | OpenStreetMap: Nominatim y Overpass (lugares, puerto, calles, límite internacional) | https://nominatim.openstreetmap.org/search?q=Ituzaingó,Corrientes,Argentina&format=json |

### Hidrómetro

| Dato | Valor | Fuente |
|---|---|---|
| Estación INA | id 15, "Ituzaingó", `id_externo` 90, río PARANAMED, propietario PNA, `abreviatura` ITUZA | INA-E |
| Serie de altura | **15** (variable 2, medición directa, m), del 16/03/1910 al 20/10/2026, 42.478 datos | INA-S (`estacion_id=15`) |
| Otras series | 26257 media diaria (1970–2026), 25493 media mensual (1970–2026), 35317 media semanal (2023–2026), 25652/25746 mín./máx. mensual (1994–2022) | INA-S |
| Coordenadas INA | −56,7; −27,5833 (≈, redondeadas) | INA-E |
| Ubicación probable del hidrómetro | Muelle de Prefectura, −56,6938; −27,5855 (destacamento PNA en −56,6937; −27,5860). Las coordenadas del INA caen ~600 m al oeste, en el agua frente al pueblo. **FALTANTE** la ubicación oficial de la escala | OSM-I (way 227906660, node 4476152138) |
| Cero IGN | **FALTANTE** (`cero_ign` = null) | INA-E |
| Cero cargado | **58,3 m, provisorio** (ver abajo) | cálculo |
| Alerta / evacuación | 3,50 m / 4,00 m (iguales en Prefectura, INA y EBY) | PNA, INA-E, EBY-IH |
| Aguas bajas | 0,81 m | INA-E (`nivel_aguas_bajas`) |
| Puerto en Prefectura | `ITUZAINGO` (historial id 90), río PARANA, dato cada 2 h | PNA |
| Represa | Yacyretá, casa de máquinas en −56,7395; −27,4828 (~12 km al NNO del hidrómetro, ~13 km por el canal). Las estaciones INA 87/88 ("Yacyretá afluente/efluente") sólo tienen caudal, no altura | OSM-I, INA-S |

### Cota del cero (caso B)

El INA no publica el cero de la estación 15. Se probaron tres métodos.

**(a) Nivel aguas abajo de Yacyretá (EBY): no disponible.** Los informes hidrológicos y resúmenes ejecutivos de la EBY
(EBY-IH, EBY-RE) dan la cota del embalse en msnm (82,90 m el 18/10/2026) y la altura de Ituzaingó **en la escala**
(4,92 m a las 12:00 del 18/10; 4,68 m a las 10:30 del 19/10), pero no el nivel de restitución en msnm. Como referencia
gruesa, la EBY da un salto de diseño de 21,3 m (EBY-CH): 83 − 21,3 ≈ 61,7 m al pie de la presa en condiciones de diseño.
Con ~0,7 m de caída hasta el hidrómetro y la mediana 2011–2026 de la escala (1,60 m), daría un cero del orden de
59,4 m. No es una medición: no se usa, sólo confirma el orden de magnitud.

**(b) Extrapolación aguas arriba desde Itá Ibaté.** No hay un hidrómetro con cero IGN aguas arriba (la represa está
en el medio y Posadas no tiene cero), así que se extrapoló la pendiente Itá Ibaté (16, cero IGN 52,42 m) → Itatí
(17, cero IGN 45,66 m):

```
pendiente = ((h16 + 52,42) − (h17 + 45,66)) / d(16,17)
agua_15   = (h16 + 52,42) + pendiente × d(15,16)
cero_15   = agua_15 − h15
```

Distancias en línea recta (OSM no respondió para medir por el río): d(15,16) = 65,6 km, d(16,17) = 91,6 km. Lecturas
diarias del INA a la misma hora (INA-O15):

| Fecha (UTC) | Ituzaingó h15 | Itá Ibaté h16 → agua | Itatí h17 → agua | Pendiente | Agua extrapolada | Cero |
|---|---|---|---|---|---|---|
| 12/02/2000 07:00 (SRTM) | 1,63 | 2,00 → 54,42 | 3,10 → 48,76 | 6,18 cm/km | 58,47 | 56,84 |
| 09/02/2022 03:00 (estiaje) | −0,30 | 0,02 → 52,44 | 0,76 → 46,42 | 6,57 cm/km | 56,75 | 57,05 |
| 03/02/2010 15:00 | 3,85 | 5,54 → 57,96 | 7,23 → 52,89 | 5,53 cm/km | 61,59 | 57,74 |
| 29/06/2013 07:00 | 4,87 | 6,44 → 58,86 | 7,56 → 53,22 | 6,16 cm/km | 62,90 | 58,03 |
| 17/12/2015 07:00 | 4,30 | 6,17 → 58,59 | 7,46 → 53,12 | 5,97 cm/km | 62,50 | 58,20 |
| 07/11/2023 03:00 | 4,75 | 6,69 → 59,11 | 7,94 → 53,60 | 6,01 cm/km | 63,05 | 58,30 |
| 18/10/2026 03:00 | 4,95 | 6,88 → 59,30 | 8,06 → 53,72 | 6,09 cm/km | 63,29 | 58,34 |
| 19/10/2026 03:00 | 4,75 | 6,94 → 59,36 | 8,17 → 53,83 | 6,04 cm/km | 63,32 | 58,57 |
| 20/10/2026 03:00 | 4,69 | 6,85 → 59,27 | 8,26 → 53,92 | 5,84 cm/km | 63,10 | 58,41 |

Con todos los días desde 2000 (9.065 fechas), la mediana del cero por banda de altura en Ituzaingó: 0–1 m → 56,91;
1–2 m → 57,01; 2–3 m → 57,29; 3–4 m → 57,91; **4–5 m → 58,16** (p10–p90: 57,85–58,50).

El resultado **no es estable**: sube ~1,4 m del río bajo al río alto. La pendiente aguas abajo de la presa no es
uniforme (con poco caudal el tramo Ituzaingó–Itá Ibaté es más empinado que el Itá Ibaté–Itatí, y el agua real en
Ituzaingó queda por encima de la extrapolada). Para el rango que importa (alerta, evacuación y crecidas, 3,5–6,4 m)
vale la banda alta: **58,2–58,6 m**. Sensibilidad a las distancias (±10–15 % de sinuosidad): **57,7–58,9 m**.

**(c) Pelo de agua del SRTM (12/02/2000).** En el DEM Terrarium el canal frente al muelle de Prefectura es plano a
**60,0 m** (transecto en −56,700 de −27,5785 a −27,5855; también 60,0 m en −56,7175; −27,588 a −27,595). Ese día la
escala marcaba **1,63 m** (INA-O15, 07:00Z; 1,68 m el 11/02 y 1,30 m el 13/02 por la operación de la presa):
60,0 − 1,63 = **58,37 m**. Incertidumbre ±1 m o más (error vertical del SRTM, agua aplanada a metro entero). En Itatí
el SRTM quedó 0,76 m por debajo del cero IGN; si pasara lo mismo acá, el equivalente IGN sería ~59,1 m.

**Valor cargado: 58,3 m, `cotaCeroProvisoria: true`.** Los métodos (b, río alto) y (c) coinciden en ±0,1 m y (a)
confirma el orden. Incertidumbre total estimada: **±1 m** (rango plausible 57,7–59,4 m). Con 58,3 m, el pelo de agua
del DEM equivale a 1,66 m en la escala, contra 1,63 m medidos ese día.

### Situación actual (21/10/2026)

| Dato | Valor | Fuente |
|---|---|---|
| Última altura Prefectura | **4,61 m**, 21/OCT/26 08:00 | PNA |
| Variación | +0,01 m en 2 h (anterior 4,60 m, 21/OCT/26 06:00) | PNA |
| Estado | EVACUACION CRECE | PNA |
| Pico de esta crecida | **4,95 m**, 18/10/2026 entre las 00:00 y las 08:00 (PNA-H15); 4,95 m el 18/10 03:00Z en el INA | PNA-H15, INA-O15 |
| Subida | 1,90 m (01/10) → 2,95 m (12/10) → 4,41 m (14/10) → 4,95 m (18/10) → 4,69 m (20/10) | INA-O15 |
| Cota del agua | 4,61 + 58,3 = **62,91 m** (provisoria) | cálculo |
| Caudal | Afluente a Yacyretá ~37.200 m³/s (18/10), ~35.000 m³/s (19/10); vertederos abiertos (brazo principal 10.900 y Añá Cuá 11.100 m³/s el 18/10) | EBY-RE, EBY-IH |
| Evacuados | 41 personas albergadas en Ituzaingó con el puerto en 4,70 m | Perfil, 19/10/2026 |

**¿Superó alguna marca?** Con 4,95 m, 2026 es el **máximo desde mayo de 1998** (5,37 m) y el mayor desde que el
embalse llegó a cota 83 (2011): superó a 2013 (4,87 m), 2014 (4,80 m), 2023 (4,75 m) y 2015-16 (4,30 m). Sigue por debajo
de 1983 (6,35 m), 1992 (5,68 m), 1997 (5,42 m) y 1998 (5,37 m).

### Crecidas de referencia (serie 15)

Máximos anuales del INA, descartando datos aislados que difieren más de 0,8 m de los días vecinos (errores de carga:
9,72 m el 17/08/2024 entre 0,80 y 0,30 m; 5,92 m el 16/05/1998 entre 2,57 y 3,49 m).

| Crecida | Pico | Fecha | Nota |
|---|---|---|---|
| 1983 | **6,35 m** | 15/07/1983 | Primer pico 6,09 m el 18/06. Máximo de toda la serie (1910–2026). |
| 1992 | **5,68 m** | 03/06/1992 | |
| 1998 | **5,37 m** | 01/05/1998 | Con la presa ya cerrada (1994) y el embalse todavía bajo (~75 m en el SRTM de 2000). |
| 2013 | **4,87 m** | 29/06/2013 | Máximo con el embalse a cota 83 hasta 2026. |
| 2015-16 | **4,30 m** | 17/12/2015 | En 2016: 4,02 m el 05/01. |
| 2023 | **4,75 m** | 07/11/2023 | |

Otros picos: 1997 5,42 m (06/02), 1990 5,52 m (28/01), 1966 5,36 m (25/02), 2014 4,80 m (12/06), 2009 4,38 m (26/10).
Estiaje reciente: −0,30 m (09/02/2022), −0,15 m (24/06/2021).

**Comparabilidad con la escala anterior a Yacyretá.** Para una misma altura en Itá Ibaté, hoy Ituzaingó marca menos
que antes de la represa (medianas de h15): con h16 ≈ 4 m, 2,80 m en 1970–1994 contra 2,05–2,30 m desde 2011; con
h16 ≈ 6 m, 4,45 m contra 3,78–4,05 m; con h16 ≈ 7 m, 5,20 m contra 4,75 m. Los picos de 1983 y 1992 equivalen hoy a
~0,5 m menos en la escala (cambio del cauce aguas abajo de la presa, reparto del caudal con el brazo Añá Cuá o
renivelación de la escala: **FALTANTE** el motivo). En Itá Ibaté, 2026 (6,94 m) tampoco superó a 1998 (7,12 m).

### Pronóstico

- **EBY (oficial, corto plazo):** el alerta hidrológico N° 8 (19/10/2026) daba para Puerto Ituzaingó 4,8/4,6 m ese día
  y **4,7/4,3 m** los días siguientes, **con validez hasta el miércoles 21/10/2026** (EBY-IH). Vence hoy: **no se
  carga** en `pronostico`. Si alguien va a mantenerlo, la EBY publica uno nuevo con cada alerta (Supabase,
  `localidades.pronostico`, sin redeploy).
- **SAH-INA:** el pronóstico del tramo argentino no incluye Ituzaingó. El modelo estacional no se usa.

### Impactos, defensas y evacuados

| Dato | Valor | Fuente |
|---|---|---|
| 19/10/2026 (4,70 m) | 41 personas albergadas en Ituzaingó; la nota no dice de dónde ni dónde | Perfil, 19/10/2026 |
| 31/10/2023 (4,12 m) | Seis familias, más de 30 personas de la **Isla Apipé**, en cabañas municipales del CID y con familiares | Primera Edición, 31/10/2023 |
| Zonas bajas del frente urbano (DEM) | Playa Punta Norte (61,5 m ≈ 3,2 m en la escala), playas Soro y Morena (62,0 m ≈ 3,7 m), muelle de Prefectura (62,7 m ≈ 4,4 m), islote Ysakã (61,2 m) | DEM, OSM-I |
| Casco urbano | Barranca de 70–80 m: no se inunda con ninguna crecida registrada (1983: 64,65 m) | DEM |
| Defensas, terraplenes | **FALTANTE** para el frente urbano. Hay espigones en la Costanera (OSM) y escolleras en la Costanera Norte Mainumby, junto a la presa (fuera del área) | OSM-I |

URLs:

- Perfil, 19/10/2026: https://www.perfil.com/noticias/amp/nea/el-nino-en-corrientes-el-parana-supero-el-nivel-de-evacuacion-en-la-capital-y-ya-hay-754-desplazados.phtml
- Primera Edición, 31/10/2023: https://www.primeraedicion.com.ar/nota/100750756/alerta-en-ituzaingo-familias-tuvieron-que-ser-evacuadas-en-la-isla-apipe-por-la-crecida-del-rio-parana/

### Geografía y área del modelo

- **Pueblo** (OSM): nodo `place=town` "Ituzaingó" en −56,6893; −27,5896. El límite de Nominatim es el municipio entero
  (−57,69 a −56,02; −28,60 a −27,31). Barrios en OSM: General Belgrano (−56,6827; −27,5807), Mbotará (−56,6805;
  −27,5839), Islas Malvinas (−56,6948; −27,5955), San Francisco de Asís (−56,7061; −27,5945), Portal del Sol (−56,7212;
  −27,6040), La Florida (−56,7290; −27,6099), San Jorge (−56,7194; −27,6144) y Rincón de Santa María (−56,6788; −27,5412).
- **Calles** (Overpass, residenciales): percentiles 2–98 en lon −56,730 a −56,666 y lat −27,617 a −27,540 (incluye
  Rincón de Santa María al norte). Accesos: RN 12 al sur (−27,585 a −27,615) y RN 120 hacia la represa.
- **Río**: el canal de restitución sale de la casa de máquinas (−56,7395; −27,4828), baja ~10 km al sur pegado a la
  costa argentina y frente al pueblo gira al oeste, entre la costa y las islas San Martín, Rivadavia y Apipé Chico
  (argentinas). En el DEM es agua plana a 60,0 m, de ~1 km de ancho frente al muelle; las islas están a 61–70 m.
- **Límite internacional** (OSM, way 682143169): va por el medio del canal, a ~250–400 m de la costa argentina. Del lado
  argentino queda una franja angosta de agua; las islas de enfrente son argentinas pero el agua del otro lado del
  límite es paraguaya.
- **Represa y embalse**: el embalse (75 m en el SRTM de 2000, hoy 83 m) está al norte de −27,50, detrás del
  terraplén lateral argentino (80–86 m). Quedan **fuera** del bbox, igual que la presa y los vertederos.
- **Relieve**: el casco está sobre una barranca de 70–80 m (la costa sube de 60 a 77 m en ~300 m). Lo único por debajo
  del pico de 1983 (64,65 m) es la franja costera (playas del noreste, muelle de Prefectura, rampas) y las islas.

Propuesta (cargada):

| Campo | Valor | Justificación |
|---|---|---|
| `bbox` [O, S, E, N] | **[−56.76, −27.61, −56.65, −27.55]** | 0,11° × 0,06°, como Itatí. Cubre el casco, la costanera, las playas del noreste, el muelle de Prefectura, los barrios del oeste hasta Portal del Sol, el canal y las islas San Martín, Rivadavia y la parte este de Apipé Chico. Deja afuera Rincón de Santa María (−27,541, a 75 m) y San Jorge (−27,614, a >70 m), ambos altos, y el embalse. |
| `centro` [lon, lat] | **[−56.69, −27.588]** | En el casco, a 200 m del nodo OSM; terreno a 80 m. |
| `zoom` | **13.4** | Mismo ancho que Itatí. |
| `semillasRio` | **[−56.700, −27.5845]** y **[−56.7175, −27.594]** | Agua plana a 60,0 m en el canal, frente al muelle de Prefectura y 2 km aguas abajo; ~250 m al sur del límite internacional (lado argentino). Orillas a 62–77 m. |

Isla Apipé Grande (San Antonio de Apipé), con evacuados en 2023, queda fuera: está al NO, del otro lado del canal y
lejos del pueblo. Si se quiere, sería un área aparte (caso D o una zona nueva con el mismo hidrómetro).

### Rango del simulador

- `simulador`: **1,80 a 6,40 m**, de a 0,05 m. El mínimo queda 1,7 m por debajo de la alerta y cerca del pelo de agua
  del DEM (1,66 m). El máximo cubre el pico de 1983 (6,35 m).
- `procesamiento.nivelesZonas_m`: **desde 1,8, hasta 6,4, paso 0,1** (47 niveles).

### Vista previa (Terrarium, cero 58,3 m)

| Altura | Cota | Área con agua |
|---|---|---|
| 3,50 m (alerta) | 61,80 m | 212 ha |
| 4,00 m (evacuación) | 62,30 m | 354 ha |
| 4,30 m (2015-16) | 62,60 m | 389 ha |
| 4,75 m (2023) | 63,05 m | 1.472 ha |
| 4,87 m (2013) | 63,17 m | 1.536 ha |
| 5,37 m (1998) | 63,67 m | 1.672 ha |
| 5,68 m (1992) | 63,98 m | 1.766 ha |
| 6,35 m (1983) | 64,65 m | 1.966 ha |

El área crece con la altura; el salto entre 4,3 y 4,75 m es el interior de las islas (61–63 m en el SRTM, con monte).
El casco queda seco (el centro se inundaría recién con 21,7 m en la escala).

### Datos faltantes de Ituzaingó

1. **Cero oficial del hidrómetro** y su sistema de alturas (Prefectura, INA, o la EBY, que lee la escala y opera la
   presa). Es la mayor incertidumbre (±1 m).
2. **Nivel aguas abajo de Yacyretá en msnm** con su hora (EBY): permitiría calibrar el cero con lecturas simultáneas.
3. **Ubicación exacta de la escala** (se supone en el muelle de Prefectura).
4. Motivo del cambio de la relación Ituzaingó–Itá Ibaté después de la represa (¿renivelación de la escala?).
5. Barrios o parajes evacuados con la crecida actual y su altura (municipio, Defensa Civil de Corrientes).
6. Defensas o cotas de la costanera de Ituzaingó (municipio).
7. Pronóstico vigente: el de la EBY vence el 21/10/2026.

## Corrientes (capital)

Datos relevados el **22/10/2026**. Caso **A** (puerto de Prefectura con `cero_ign` en el INA). Todas las consultas se
hicieron con el `User-Agent` `mapa-crecida-parana (proyecto informativo sin fines de lucro)`. Fuentes nuevas además de
las de la tabla general:

| Sigla | Fuente | URL |
|---|---|---|
| INA-O19 | INA, API a5: observaciones de la serie 19 (1901–2026, 47.980 datos) | https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=19&timestart=1900-01-01&timeend=2026-10-23&format=json |
| INA-T | INA, API a5: pronóstico del SAH (calibrado 289 "tabprono_central", serie simulada 1540), emitido el 20/10/2026 | https://alerta.ina.gob.ar/a5/sim/calibrados/289/corridas/last?estacion_id=19&includeProno=true&format=json |
| SAH-T | INA, "Pronóstico Hidrométrico, río Paraná tramo Argentino" del 20/10/2026 (la tabla es una imagen; los valores salen de INA-T) | https://www.ina.gob.ar/archivos/alerta/TabProno20261020.pdf |
| IDEMCC | Municipalidad de Corrientes, Infraestructura de Datos Espaciales (IDEMCC, miembro de IDERA): GeoServer con WMS y WFS | https://gis.ciudaddecorrientes.gov.ar/geoservicios.php |
| IDEMCC-B | IDEMCC, WFS `wfs_idemcc:vw_barrios_de_la_ciudad` (140 barrios con nombre, tipo y ordenanza) | https://gisdesa.ciudaddecorrientes.gov.ar:8282/geoserver/wfs_idemcc/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=wfs_idemcc:vw_barrios_de_la_ciudad&outputFormat=application/json&srsName=EPSG:4326 |

**Uso de los datos de la IDEMCC.** Las capacidades del WMS y del WFS declaran `Fees: NONE` y `AccessConstraints:
NONE`, pero el portal no publica una licencia. El WFS pide el usuario público que la Municipalidad publica en
`geoservicios.php` para el acceso abierto. Los barrios se usaron **sólo para validar** el modelo y nombrar zonas en esta
ficha: la app no muestra ni redistribuye geometrías de la IDEMCC, así que no hace falta atribución en
`src/lib/creditos.ts`. Si más adelante se quisiera mostrar una capa municipal (barrios, centros de evacuados), primero
hay que pedir las condiciones de uso a la Dirección General de SIG (idecorrientes@gmail.com) y sumar la atribución.
La IDEMCC no tiene capas de relieve, curvas de nivel, cotas ni defensas (revisadas las 165 capas del WMS el 22/10/2026).

### Hidrómetro

| Dato | Valor | Fuente |
|---|---|---|
| Estación INA | id 19, "Corrientes", `id_externo` 130, río PARANAMED, propietario PNA, `abreviatura` CORR | INA-E |
| Serie de altura | **19** (variable 2, medición directa, m), del 02/01/1901 al 21/10/2026, 47.980 datos | INA-S (`estacion_id=19`) |
| Otras series | 26261 media diaria (1901–2026), 25497 media mensual, 868 caudal (curva de gasto), 1540 altura pronosticada (SAH) | INA-S |
| Coordenadas | −58,8388696; −27,46364349 (puerto, junto al barrio La Rosada) | INA-E |
| Cero IGN | **42,39 m** | INA-E (`cero_ign`) |
| Sistema de referencia del cero | **FALTANTE**: la API no lo informa (`altitud` = null) | INA-E |
| Alerta / evacuación | 6,50 m / 7,00 m (iguales en INA y Prefectura) | PNA, INA-E |
| Aguas bajas | 1,83 m | INA-E (`nivel_aguas_bajas`) |
| Puerto en Prefectura | `CORRIENTES` (historial id 130), río PARANA, dato cada 2 h | PNA |

**Control del cero con el relieve.** El 12/02/2000 (pasada del SRTM) el hidrómetro marcaba **2,95 m** (07:00Z;
2,90 m el 11/02 y 2,94 m el 13/02) (INA-O19), o sea agua a 2,95 + 42,39 = **45,34 m**. En el DEM Terrarium el cauce
frente al puerto es plano a **45,0 m** (transecto en −27,4636, de −58,865 a −58,850) y aguas abajo, frente a Arazaty y
Villa Patono, a 44,0 m. Diferencia: **−0,34 m**, menor que en Itatí (−0,76 m). Se carga el cero IGN sin corregir,
`cotaCeroProvisoria: false`.

### Situación actual (22/10/2026)

| Dato | Valor | Fuente |
|---|---|---|
| Última altura Prefectura | **7,43 m**, 22/OCT/26 08:00 | PNA |
| Variación | +0,05 m en 2 h (anterior 7,38 m, 22/OCT/26 06:00) | PNA |
| Estado | EVACUACION CRECE | PNA |
| Última lectura en el INA | 7,36 m, 2026-10-21T03:00Z | INA-O19 |
| Cota del agua | 7,43 + 42,39 = **49,82 m** | cálculo |
| Subida en octubre | 4,92 m (10/10) → 5,50 m (14/10) → 6,13 m (16/10) → 6,89 m (18/10) → 7,27 m (20/10) → 7,36 m (21/10) | INA-O19 |

Con 7,43 m el río **superó el pico de 2023 (7,15 m) y el de diciembre de 2015 (7,41 m)**, y está a 4 cm del de enero de
2016 (7,47 m). Si los pasa, es la marca más alta en Corrientes desde mayo de 1998 (8,39 m).

### Crecidas de referencia (serie 19)

| Crecida | Pico | Fecha | Nota |
|---|---|---|---|
| 1983 | **9,02 m** | 18/07/1983 | Primer pico de 8,98 m el 21/06. Máximo de la serie (1901–2026) |
| 1992 | **8,64 m** | 08/06/1992 | |
| 1998 | **8,39 m** | 04/05/1998 | |
| 2015-16 | **7,47 m** | 09/01/2016 | Misma crecida (El Niño 2015-16): 7,41 m el 21/12/2015 |
| 2023 | **7,15 m** | 09/11/2023 | 21:00Z |

Otros picos: 1905 8,57 m (05/06), 1966 y 1990 7,93 m, 1982 7,80 m (11/12), 1997 7,70 m (11/02), 2013 7,22 m (04/07),
2014 7,16 m (18/06). Estiaje reciente: **0,04 m** (20 y 21/01/2022). No se descartó ningún dato aislado (ninguna lectura
difiere más de 0,8 m de las vecinas). Fechas en UTC, como las da `timestart`.

### Pronóstico

- **SAH-INA (oficial, corto plazo):** el pronóstico del 20/10/2026 (INA-T, SAH-T) da para Corrientes **7,14 m
  (6,60–7,40) el 27/10** y **7,58 m (7,00–7,80) el 03/11/2026**. Son "tendencias en los valores medios diarios" y el
  SAH los actualiza el **23/10/2026**. La lectura del 22/10 (7,43 m) ya supera la banda alta del 27/10.
- **No se carga en `pronostico`**: vence en un día y nadie lo mantiene. Si se decide mostrarlo, se carga en Supabase
  (`localidades.pronostico`, sin redeploy) con cada emisión del SAH (dos por semana), o se lee de INA-T desde la app
  (cambio aparte).

### Impactos, defensas y evacuados

| Fecha (altura en el puerto) | Lugares | Qué pasó | Fuente |
|---|---|---|---|
| Nov. 2023 (6,15 m, creciendo) | Virgen de los Dolores, Quinta Ferré, Arazaty, Itatí, Anahí y Lomas del Mirador | "Los anegamientos alcanzaron los barrios capitalinos…"; familias de barrios costeros evacuadas; el CIC del barrio Anahí como centro de evacuación | Economis, nota de 2023 (sin fecha visible; imagen de noviembre de 2023): https://economis.com.ar/?p=337801 |
| 15/10/2026 (5,79 m) | Punta Taitalo, Puerto Italia y la franja entre el barrio Caridi y La Tosquera | El intendente los señala como los sectores ribereños más expuestos | Perfil, 15/10/2026 (URL en la ficha de Itatí) |
| 16/10/2026 (6,23 m) | Barrio Anahí (zona norte); costanera en Punta San Sebastián | Agua en calles, veredas y viviendas de Anahí; 71 autoevacuados (14 familias) en la capital; Defensa Civil prevé el agua en la Costanera a la altura de Punta San Sebastián; se prepara una escuela de Molina Punta como refugio | Elonce, 16/10/2026: https://www.elonce.com/uid-889586 ; Perfil, 16/10/2026: https://www.perfil.com/noticias/nea/crecida-del-rio-parana-supero-los-6-metros-en-la-capital-y-ya-hay-222-evacuados-en-corrientes.phtml |
| 19/10/2026 (7,07 m) | Punta Taitalo, Río Paraná, Itatí, Sol de Mayo; "bajo Caridi" (foto) | 344 autoevacuados según Defensa Civil (380 personas, 103 familias, según Desarrollo Social municipal) | Perfil, 19/10/2026 (URL en la ficha de Ituzaingó); Canal 12 Misiones, 19/10/2026: https://www.canal12misiones.com/informacion-general/parana-corrientes-750-evacuados |
| Defensas o terraplenes | **FALTANTE** | No se encontró información pública de defensas de la capital con cota de coronamiento (la IDEMCC no tiene la capa). El casco está sobre la barranca; la Costanera es un muro costero sin cota publicada | búsqueda web, IDEMCC |
| Centros de evacuados | **PARCIAL**: CIC del barrio Anahí (2023), Centros Integradores Comunitarios y una escuela de Molina Punta (2026), sin lista oficial ni coordenadas | | notas citadas |

"Itatí", "Caridi", "Puerto Italia", "La Tosquera" y "Punta San Sebastián" no figuran como barrios en la IDEMCC
(son asentamientos o parajes); su ubicación exacta es **FALTANTE**.

### Geografía y área del modelo

- **Ciudad** (OSM, Nominatim): relación 8878216 "Corrientes" (ejido urbano) de −58,859 a −58,712 y de −27,538 a
  −27,424; el municipio (relación 3127758) llega a −58,626 y −27,682. Overpass no respondió el 22/10/2026 (servidores
  saturados); los barrios de la IDEMCC reemplazan el conteo de calles.
- **Barrios** (IDEMCC-B): los 140 polígonos ocupan lon −58,857 a −58,650 y lat −27,551 a −27,404. Los del este
  (clubes de campo, Laguna Brava, Paso Martínez) están en la meseta y alrededor de lagunas, a 58–68 m.
- **Río**: viene de Paso de la Patria (NE) pegado a la costa norte (Perichón, Punta Taitalo, Molina Punta), pasa
  frente al puerto y el puente General Belgrano y gira al sur frente a Arazaty y Villa Patono. En el DEM, agua plana a
  45,0 m frente al puerto y a Punta Taitalo, y a 44,0 m aguas abajo. Enfrente están las islas (47–55 m) y, detrás del
  riacho Barranqueras, Barranqueras y Resistencia (Chaco). Ambas orillas son argentinas: el límite es provincial.
- **Relieve** (DEM, con vegetación y edificios): el casco y casi toda la ciudad están sobre una barranca de 60–66 m,
  por encima del pico de 1983 (9,02 + 42,39 = 51,41 m). Por debajo quedan la franja costera del norte (Perichón, Punta
  Taitalo, Molina Punta), el bajo de Bañado Norte, Sol de Mayo, Anahí y Quinta Ferré (entrada de agua por −58,81;
  −27,46), la costa de Arazaty, Galván y Virgen de los Dolores, el barrio Río Paraná y el valle del Riachuelo al sur
  (44–51 m, barrios Esperanza y Santa Margarita).

Propuesta (cargada):

| Campo | Valor | Justificación |
|---|---|---|
| `bbox` [O, S, E, N] | **[−58.885, −27.565, −58.73, −27.40]** | 0,155° × 0,165° (unas 3,7 veces Itatí). De Perichón (N, −27,404) al valle del Riachuelo (S) y del cauce frente al puerto (O) al borde este de Perichón (−58,733). Deja afuera Barranqueras y Resistencia (detrás de sus defensas, que el modelo no tiene: aparecerían inundadas) y la meseta del este con sus lagunas, que no se conectan con el río. |
| `centro` [lon, lat] | **[−58.832, −27.47]** | Barrio Centro (IDEMCC-B); terreno a 63,7 m. |
| `zoom` | **12.9** | Itatí usa 13,4 con 0,11° de ancho; con 0,155° hace falta ~0,5 menos. |
| `semillasRio` | **[−58.857, −27.4636]**, **[−58.86, −27.49]** y **[−58.79, −27.435]** | Cauce frente al puerto (45,0 m), aguas abajo frente a Arazaty (44,0 m) y aguas arriba frente a Punta Taitalo (45,0 m). La diferencia de 1 m entre semillas es la pendiente del río y el redondeo a metro del SRTM, no tierra. |

### Rango del simulador

- `simulador`: **4,80 a 9,10 m**, de a 0,05 m. El mínimo queda 1,7 m por debajo de la alerta; el máximo cubre el pico
  de 1983 (9,02 m).
- `procesamiento.nivelesZonas_m`: **desde 4,8, hasta 9,1, paso 0,1** (44 niveles).

### Vista previa (`vista-previa.mjs`, SRTM sin corregir, cero 42,39 m)

| Altura | Cota | Área con agua |
|---|---|---|
| 6,50 m (alerta) | 48,89 m | 2.417 ha |
| 7,00 m (evacuación) | 49,39 m | 3.263 ha |
| 7,15 m (2023) | 49,54 m | 3.335 ha |
| 7,43 m (22/10/2026) | 49,82 m | 3.520 ha |
| 7,47 m (2015-16) | 49,86 m | 3.545 ha |
| 8,39 m (1998) | 50,78 m | 4.835 ha |
| 8,64 m (1992) | 51,03 m | 5.746 ha |
| 9,02 m (1983) | 51,41 m | 6.159 ha |

El área crece con la altura; la mayor parte son islas y el valle del Riachuelo. El centro queda seco (se inundaría
recién con 21,3 m en la escala).

**Validación con los barrios de la IDEMCC.** Cruzando los polígonos de barrios con el mismo modelo, los que tienen
agua con 7,07 m (19/10/2026) son, de más a menos superficie: Arazaty (23 %), Río Paraná (17 %), 3 de Abril (16 %),
Esperanza (14 %), Lomas del Mirador (13 %), Plácido Martínez (11 %), Galván (11 %), Sol de Mayo (7 %), Sor María
Assunta Pittaro (7 %), Quinta Ferré (5 %), Villa Patono (5 %), Anahí y Punta Taitalo (4 %). Coincide con los barrios
nombrados por el municipio y la prensa en 2023 y 2026 (Arazaty, Lomas del Mirador, Río Paraná, Sol de Mayo, Quinta
Ferré, Virgen de los Dolores, Anahí, Punta Taitalo, Molina Punta). Los porcentajes son bajos porque el SRTM mide techos
y árboles; Virgen de los Dolores casi no se moja hasta 8 m en el SRTM (1 % con 7,07 m, 7 % con 8,39 m), cuando en 2023 se anegó con ~6,2 m: el relieve
sin corregir queda alto en la costa poblada, como en las demás localidades.

### Relieve procesado (`procesar.py corrientes`, 22/10/2026)

- Copernicus GLO-30 con corrección por cobertura (WorldCover) y mediana de 5 px; sin defensas. Grilla del modelo de
  1806 × 2168 celdas de 8,5 m. Pelo de agua de Copernicus: 43,0 m (≈ 0,61 m en la escala): es el valor aplanado que
  edita Copernicus sobre el agua, no una medición (ver `cota-del-cero.md`, métodos descartados).
- Zonas: 4,80 m → 4.122 ha; 5,50 → 4.875; 6,20 → 5.404; 6,90 → 5.922; 7,60 → 6.241; 8,30 → 6.515; 9,00 → 6.803 ha.
  Crecen con la altura; con 4,80 m ya hay mucha superficie porque la corrección por árboles baja el monte de las islas
  y del valle del Riachuelo.
- Escena 3D: 25.000 árboles y 146.653 edificios (Overture 2026-10-21.0). Peso de `public/data/relieve/corrientes/`:
  **29 MB** (12 MB de tiles, 11 MB de escena), unas 3,5 veces una localidad chica.
- Barrios de la IDEMCC con agua en el modelo procesado (% de la superficie con 6,15 / 7,07 / 9,02 m): Esperanza
  20 / 22 / 56, 3 de Abril 28 / 32 / 38, Arazaty 19 / 21 / 37, Lomas del Mirador 20 / 22 / 27, Río Paraná 20 / 21 / 23,
  Villa Patono 13 / 16 / 21, Quinta Ferré 12 / 13 / 20, Galván 14 / 16 / 20, Virgen de los Dolores 11 / 12 / 15, Sol
  de Mayo 12 / 13 / 15, Molina Punta (parque balneario) 5 / 6 / 9, Punta Taitalo 6 / 6 / 9, Anahí 6 / 7 / 8. Con el
  relieve corregido, Virgen de los Dolores ya se moja con 6,15 m, como en 2023. El centro queda seco (umbral a 16,8 m
  en la escala). La lista de barrios citados por la prensa coincide; para confirmar las alturas a las que se anega
  cada uno falta el registro de Defensa Civil.

### Datos faltantes de Corrientes

1. **Defensas y cota de la Costanera** (muro costero, Punta San Sebastián, accesos al puerto): Municipalidad (Obras
   Públicas) o ICAA. Es lo que más cambiaría el mapa en el frente urbano.
2. Sistema de referencia vertical del cero IGN (como en todas las estaciones).
3. Ubicación de los asentamientos y parajes citados por la prensa (Itatí, Caridi, Puerto Italia, La Tosquera, Punta San
   Sebastián) y la altura del río con la que se anegó cada uno: Defensa Civil municipal.
4. Lista oficial y ubicación de los centros de evacuados de 2026.
5. Condiciones de uso de los datos de la IDEMCC, por si se quiere mostrar alguna capa municipal en la app.
6. Pronóstico mantenido: el del SAH se renueva dos veces por semana (próximo, 23/10/2026).

## Bajo Paraná / Delta: Campana y Zárate

Datos relevados el **21/10/2026**. Cada valor lleva su fuente; lo que no se pudo obtener figura como **FALTANTE**.
Las dos ciudades están sobre el **Paraná de las Palmas**, el brazo sur del Delta, separadas por ~9,5 km de río
(Zárate aguas arriba). No son del NEA: van en esta sección aparte del catálogo.

### Fuentes

| Sigla | Fuente | URL |
|---|---|---|
| INA-E | INA, API a5: estaciones de la red de Prefectura | https://alerta.ina.gob.ar/a5/obs/puntual/estaciones?tabla=alturas_prefe&format=json |
| INA-S | INA, API a5: series de Campana y Zárate | https://alerta.ina.gob.ar/a5/obs/puntual/series?estacion_id=41&format=json (y `estacion_id=40`) |
| INA-O | INA, API a5: observaciones (series 40, 41, 38, 39; 1977 a 2026, bajadas completas) | https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=41&timestart=1977-01-01&timeend=2026-10-22&format=json |
| INA-P | INA, API a5: modelo del Delta (calibrado 489 "288_ajuste_salidas", corrida del 21/10/2026 09:25Z) | https://alerta.ina.gob.ar/a5/sim/calibrados/489/corridas/last?estacion_id=41&includeProno=true&format=json |
| PNA | Prefectura Naval, Altura de los ríos (tabla del 21/10/2026, 00:00) | https://contenidosweb.prefecturanaval.gob.ar/alturas/ |
| PNA-H | Prefectura Naval, historial de un año (Zárate id 340, Campana id 350) | https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=365&id=340 (y `id=350`) |
| OSM | OpenStreetMap: Nominatim (nodos de las ciudades) y Overpass (calles, barrios, ríos) | https://nominatim.openstreetmap.org/search?q=Campana,Buenos+Aires,Argentina&format=json |
| DEM | Terrarium (SRTM, pasada de febrero de 2000), z14 | https://s3.amazonaws.com/elevation-tiles-prod/terrarium/14/{x}/{y}.png |
| CRA | Cruz Roja Argentina / IFRC, informe de la emergencia de mayo de 2025 | https://go-api.ifrc.org/api/downloadfile/91271/MDRAR024do |
| INA-C | INA, "Campaña de relevamiento de ceros hidrométricos", informe LHA 02-373-18 (marzo de 2018): nivelación IGN-INA del 6 al 18/12/2016 | https://www.ina.gob.ar/delta/pdf/03_02_INA-DELTA_Info04_CerosHidrometricos.pdf |
| IGN-N | IGN, red de nivelación de alta precisión (WFS, capa `ign:nivelacion_alta_precision`) | https://wms.ign.gob.ar/geoserver/ows?service=WFS&request=GetFeature&typeNames=ign:nivelacion_alta_precision |
| IGN-M | IGN, MDE 5 m "0029 - 2015 - Ciudades - Zárate Campana" (WFS `ign:mde`; se pide a asesoriatecnica@ign.gob.ar) | https://www.ign.gob.ar/NuestrasActividades/Geodesia/ModeloDigitalElevaciones/faq |

Todas las consultas se hicieron el 21/10/2026 con el `User-Agent` `mapa-crecida-parana (proyecto informativo sin fines
de lucro)`.

### Hidrómetros

| Dato | Campana | Zárate | Fuente |
|---|---|---|---|
| Estación INA | id **41**, "Campana", `id_externo` 350, río PARANADELASPALMAS, propietario PNA | id **40**, "Zárate", `id_externo` 340, río PARANADELASPALMAS, propietario PNA | INA-E |
| Serie de altura | **41** (var. 2, medición directa), 24/10/1977 a 20/10/2026, 15.976 datos. Hueco 1981-1982 | **40** (var. 2, medición directa), 01/01/1978 a 20/10/2026, 15.912 datos. **Hueco 2000-2005** | INA-S |
| Otras series | 26283 media diaria, 25519 media mensual, 3405 altura simulada (modelo del Delta) | 26282 media diaria, 3538 media mensual, 3224 aforos 1997-98 | INA-S |
| Coordenadas | −58,9581750; −34,1555854 (orilla sur, frente al puerto). La escala nivelada en 2016 está en −58,95594; −34,15517 (muelle de Desarrollos Portuarios S.A.) | −59,0108658; −34,0987818 (orilla oeste, frente al puerto). La escala nivelada en 2016 está 175 m al sur: −59,01072; −34,10036 (muelle de madera de Prefectura) | INA-E, INA-C |
| Cero IGN | **0,418 m** | **0,243 m** | INA-E (`cero_ign`), INA-C |
| Sistema de referencia | **Cero IGN** (alturas ortométricas de la red de nivelación del IGN, datum en el mareógrafo de Mar del Plata). Bulón **BUHB**: 3,875 m IGN, altura elipsoidal 20,836 m, a 55,5 m de la escala | **Cero IGN**, igual que Campana. Bulón **BUHC**: 3,463 m IGN, altura elipsoidal 20,335 m, a 92 m de la escala. En 2016 la escala estaba "en mal estado" | INA-C |
| Alerta / evacuación | 2,20 / 2,45 m (iguales en INA y PNA) | **2,20 / 2,40 m en PNA**, los que cita la prensa local (2019, 2026); el INA tiene 2,00 / 2,20 | PNA, INA-E |
| Aguas bajas | FALTANTE (null en el INA) | 0,25 m | INA-E |
| Puerto en Prefectura | `CAMPANA`, río "DELTA PARANA", dato cada 12 h | `ZARATE`, río "DELTA PARANA", dato cada 12 h | PNA |

El parser de la app (`parsearAlturaPrefectura`) encuentra las dos filas en la tabla del 21/10/2026.

**Zárate sí está en el INA con cero IGN.** El relevamiento previo la daba como ausente de `alturas_prefe`, pero la
estación 40 está, con `cero_ign` 0,243. Por eso Zárate es **caso A**, no B ni C.

### Cota del cero y control

**Campana (caso A): 0,418 m**, `cotaCeroProvisoria: false`.

**Zárate (caso A): 0,243 m**, `cotaCeroProvisoria: false`. Se controló que los dos ceros sean coherentes entre sí
comparando el pelo de agua (`h + cero`) de Zárate menos el de Campana a la misma hora. Aguas arriba el agua tiene que
estar igual o más alta:

| Período (lecturas simultáneas) | n | Mediana | p25 a p75 | p5 a p95 | Fuente |
|---|---|---|---|---|---|
| 1977-1990 | 2.822 | −0,02 m | −0,17 a +0,13 | −0,38 a +0,42 | INA-O |
| 1990-2000 | 3.434 | **−0,22 m** | −0,33 a −0,12 | −0,58 a +0,09 | INA-O |
| 2010-2020 | 2.811 | +0,03 m | −0,07 a +0,13 | −0,28 a +0,33 | INA-O |
| 2020-2026 | 2.223 | +0,08 m | −0,03 a +0,18 | −0,26 a +0,33 | INA-O |
| Último año (00 y 12 h) | 680 | +0,18 m | +0,14 a +0,22 | −0,06 a +0,38 | PNA-H |
| 14/10 a 20/10/2026 | 12 | +0,10 a +0,25 m | | | PNA-H |

Desde 2010 el agua en Zárate queda 0,03 a 0,18 m por encima de la de Campana, es decir 1 a 2 cm/km en ~9,5 km de río:
coherente. En los años 90 la diferencia era negativa (−0,22 m), lo que sugiere un cambio de escala o de cero en esa
década; los ceros actuales se ajustan a las lecturas recientes. Con el río alto la diferencia no cambia (mediana
+0,02 m con Campana entre 1,0 y 2,0 m, desde 2000).

**Control contra el DEM (12/02/2000, pasada del SRTM):**

| | Campana | Zárate |
|---|---|---|
| Lectura del 12/02/2000 | 0,60 m (07:00Z) | **FALTANTE** (hueco 2000-2005); estimada 0,8-0,9 m con Campana + diferencia reciente |
| Agua con el cero IGN | 0,60 + 0,418 = **1,02 m** | ~1,1-1,2 m |
| Pelo de agua del SRTM frente al puerto | −0,2 a −0,3 m (−1,1 m frente a Siderca) | −0,7 a −1,0 m |
| Diferencia DEM − IGN | **≈ −1,2 m** (−2,1 m con la semilla más baja) | **≈ −2,0 m** |

Las diferencias están en el límite o pasan el ~1,5 m que la skill marca como sospechoso. Se revisó lo que pide
`cota-del-cero.md`: las coordenadas del INA no están redondeadas y caen sobre la orilla del puerto, y las muestras están
en el cauce principal (transectos del DEM: franja de 200 a 400 m de −0,2 a −1,1 m entre orillas de 3 a 10 m). No se
corrige el cero, porque en el Delta el control es débil:

- **Marea y viento:** entre el 10 y el 16/02/2000 Campana leyó 0,30, 0,40, 0,60, 0,75, 1,40, 1,60 y 1,10 m. No se sabe
  a qué hora pasó el SRTM; el agua pudo estar medio metro más arriba o más abajo que la lectura de las 07:00Z.
- **El SRTM sobre el agua es ruidoso:** en el DEM, el agua de Zárate queda 0,7 m más baja que la de Campana, lo que es
  físicamente imposible (está aguas arriba). En el Delta el SRTM también mide la copa del monte de las islas.
- **Sistema de alturas del cero:** resuelto después (ver abajo): es el cero IGN.

**Este control no vale para el modelo.** `procesar.py` usa Copernicus GLO-30 (radar de 2011-2015, EGM2008), no el
SRTM de 2000, y Copernicus aplana el río en **0,00 m** en las semillas y frente a los dos hidrómetros: es un valor
editado, no una medición del agua.

**Control con la nivelación IGN-INA y los puntos del IGN (relevado el 21/10/2026):**

- Los dos ceros salen de la misma campaña IGN-INA (6 al 18/12/2016), que niveló las escalas desde bulones nuevos
  ligados a la red de nivelación de alta precisión: Campana 0,42 m (BUHB), Zárate 0,24 m (BUHC), "respecto del Cero
  IGN" (INA-C, tabla de resultados). El informe no dice si las cotas de la red estaban en SRVN71 o en SRVN16.
- DEM corregido (Copernicus) contra puntos con cota en tierra firme:

| Punto | Cota (m IGN) | DEM corregido | DEM − IGN | Fuente |
|---|---|---|---|---|
| BUHB, pavimento del puerto de Campana (−58,95536; −34,15531) | 3,875 | 3,71 | −0,17 | INA-C |
| PF5N(131), junto a San Cayetano (−59,00738; −34,16108) | 2,703 | 2,50 | −0,20 | IGN-N (la chapa está en un pilar) |
| Mojón de Geodesia, Alem y Berutti, Campana | 3,60 (IGM, c. 1999) | 3,11 | −0,49 | Plan Estratégico de Campana; sistema y fecha inciertos |
| BUHC, Prefectura de Zárate | 3,463 | 2,01 | — | píxel mixto con el agua: no sirve |
| PF1N(132), Costanera Apolo XI, Zárate | 4,242 | 6,62 | — | pilar o edificio en el píxel: no sirve |

  Con dos puntos buenos, en Campana el relieve queda ~0,2 m por debajo de las cotas IGN: el modelo marcaría agua unos
  20 cm antes de lo real (del lado seguro). Es un indicio, no una calibración. En Zárate no hay punto útil en tierra
  firme; los PF2N, PF3N y PF4N(132) de las islas (2,57 a 3,05 m) figuran destruidos.
- **No se pasan los ceros a EGM2008.** Con la ondulación del geoide que da cada bulón (altura elipsoidal − cota IGN)
  contra EGM2008 (GeographicLib), el cero equivalente sería 0,684 m en Campana (+0,266) y 0,351 m en Zárate (+0,108).
  Esos 16 cm de diferencia entre dos puertos a 9,5 km dejarían el agua de Zárate 0,13 m por debajo de la de Campana
  en 2017-2024, lo que es imposible. Además, con +0,27 m el modelo inundaría San Cayetano con la sudestada de 2023, y
  ese día quedó seco. Se mantienen los ceros IGN, que son coherentes entre sí.
- **Diferencia Zárate − Campana reciente:** pasó de +0,03 m (2017-2024) a +0,16/+0,17 m (2025-2026, desde diciembre
  de 2024). Puede ser hidráulico o un cambio de la escala de Zárate (estaba en mal estado): sin documentar.

### Situación actual (21/10/2026)

| Dato | Campana | Zárate | Fuente |
|---|---|---|---|
| Última altura | **0,40 m**, 21/OCT/26 00:00 | **0,81 m**, 21/OCT/26 00:00 | PNA |
| Variación (12 h) | 0,00 m (anterior 0,40, 20/OCT/26 12:00) | +0,05 m (anterior 0,76, 20/OCT/26 12:00) | PNA |
| Estado | ESTAC. | CRECE | PNA |
| Cota del agua | 0,40 + 0,418 = 0,82 m | 0,81 + 0,243 = 1,05 m | cálculo |
| Última lectura en el INA | 0,30 m, 2026-10-20T03:00Z | 0,68 m, 2026-10-20T03:00Z | INA-O |
| Máximo del último año | 2,00 m (05/04/2026) | 2,25 m (05/04/2026) | PNA-H |
| Mínimo del último año | −0,55 m (21/10/2025) | −0,08 m (16/03/2026) | PNA-H |

Los dos puertos están lejos de la alerta (2,20 m). La crecida que hoy afecta al NEA (Itatí 8,17 m) no se ve en el
Delta: en el Paraná de las Palmas manda la marea y el viento. Aguas arriba, San Pedro lee 1,82 m (alerta 3,40) y
Baradero 1,65 m (alerta 2,70) (PNA).

### Crecidas de referencia

**Campana (serie 41)**

| Crecida | Pico | Fecha | Tipo |
|---|---|---|---|
| 1983 | **2,72 m** | 24/07/1983 | Crecida del río: de julio a agosto se mantuvo entre 2,5 y 2,7 m |
| 1998 | **2,70 m** | 15/05/1998 | Crecida del río (también 2,70 m el 04/02/1998, por una sudestada de un día) |
| Sudestada 2000 | **3,00 m** | 17/05/2000 | **Máximo de la serie.** Un día: 1,7 m el 16/05 y 2,1 m el 18/05 |
| 2016 | **2,65 m** | 19/04/2016 | Crecida del río (El Niño 2015-16) con picos de viento. En 2015 el máximo fue 1,90 m |
| Sudestada 2023 | **2,45 m** | 19/12/2023 | Un día (1,05 m el 17/12 y 1,70 m el 20/12) |

Otros picos: 1985 2,93 m (11/07, sudestada de un día), 1993 2,90 m (08/02, sudestada), 1996 2,75 m (04/04).
Estiaje reciente: **−0,75 m** el 31/12/2021 (−0,70 m el 12/01/2022). Fechas en UTC, como las da `timestart`.

**Zárate (serie 40)**

| Crecida | Pico | Fecha | Tipo |
|---|---|---|---|
| 1983 | **3,30 m** | 25/07/1983 | Crecida del río; también 3,30 m el 14/03/1983. Es el máximo de la serie |
| 1998 | **2,95 m** | 28/05/1998 | Crecida del río |
| Sudestada 2000 | **FALTANTE** | | La serie no tiene datos entre 2000 y 2005 |
| 2016 | **2,85 m** | 25/04/2016 (18:00Z) | Crecida del río con picos de viento |
| Sudestada 2023 | **2,60 m** | 19/12/2023 | Un día |

Otros picos: 1985 2,92 m (03/09), 1979 2,90 m (12/12), 2010 2,60 m (02/09, sudestada). Estiaje reciente: −0,41 m
(07/09/2024).

En 1983 la diferencia entre Zárate (3,30) y Campana (2,72) fue mayor que la habitual: con el río muy cargado la
pendiente del tramo crece. En las sudestadas los dos puertos suben casi lo mismo.

### Pronóstico

- **No se carga.** El INA corre un modelo horario del Delta (calibrado 489, serie simulada 3405 de Campana) (INA-P). La
  corrida del 21/10/2026 da para Campana entre 0,51 m (21/10 00:00) y **1,41 m** (25/10 00:00Z), con banda del 99 % hasta
  1,61 m: por debajo de la alerta. Es un pronóstico de marea que se renueva todos los días; como rango fijo en
  `pronostico` vencería en horas y nadie lo mantendría. Si se quiere mostrar, conviene leerlo desde la API (cambio de la
  app aparte).
- Zárate no tiene salida en ese modelo (su único calibrado es el estacional 499, que no sirve).
- El "Pronóstico Hidrométrico, río Paraná tramo Argentino" del SAH llega hasta Rosario: no cubre el Delta.

### Impactos conocidos

| Dato | Valor | Fuente |
|---|---|---|
| Mayo de 2025 | Más de 1.600 evacuados en Campana y 160 en Zárate. Barrios afectados en Campana: San Cayetano, Lubo, Las Acacias y Villa Nueva. Fue **por lluvia** (más de 400 mm) y drenaje, no por el río: Campana no pasó de 1,60 m en todo 2025 | CRA; INA-O |
| Agosto de 2015 | Más de 500 evacuados en Campana, también por lluvias (el río no pasó de 1,90 m en 2015) | La Izquierda Diario, https://www.laizquierdadiario.com/En-Campana-las-PASO-bajo-el-agua |
| Inundaciones por el río (sudestada o crecida) con altura y barrios | **PARCIAL**: ver "Observaciones de inundación por el río" | — |
| Defensas, terraplenes, cota de la costanera | **Cotas FALTANTES.** Se sabe de la obra, sin coronamiento: tablestacado de Costanera Sur de Zárate (licitado en 2015; el informe INA SLH 02-406-23 que lo estudia no se pudo bajar, repositorio caído); dique de Villa Angus; terraplenes perimetrales de San Cayetano (2016 y 2026), terraplén de Ibarra y Ahumada con 12 caños con tapas automáticas al arroyo de la Cruz (2026), terraplén de Ochoa y Camino Viejo (Santa Lucía), compuertas de Santa Lucía y de Euroamérica, estación de bombeo de San Cayetano. Única cota referida al hidrómetro: muelle del puerto PIAPSA (km 104, al sur de Zárate) coronado en +4,00 m "referida al hidrómetro local" | https://www.construar.com.ar/2015/11/construiran-tablestacado-en-la-costanera-sur-en-zarate-70-millones/ ; https://www.campananoticias.com/noticia_amp.php?id=94861 ; https://grupoirizar.com.ar/obra-bo-san-cayetano-etapa-hidraulica-partido-de-campana/ ; https://participacionpublica.ambiente.gba.gob.ar/adjunto/viewpdf/TERMINAL-PORTUARIA-PUERTO-PIAPSA.pdf |

El modelo representa **sólo el desborde del río**. Las inundaciones más grandes recientes de las dos ciudades fueron
por lluvia en barrios que drenan a los arroyos (La Cruz, Pesquería, Morejón), y el mapa no las muestra. Conviene que
eso quede claro (ver "Avisos del Delta").

### Observaciones de inundación por el río

Relevadas el 21/10/2026 en la prensa local. Altura del INA (serie 41 o 40, una lectura por día, UTC) salvo que se
indique otra; las lecturas diarias pueden no capturar el pico de una sudestada. "Modelo" es la altura de escala con la
que `umbral.tif` inunda el lugar, con los ceros actuales.

| Fecha | Lugar | Qué pasó | Altura | Modelo | Fuente |
|---|---|---|---|---|---|
| 19/12/2023, Campana | San Cayetano y casco | Sólo anegamientos en islas (canal Irigoyen, canal Alem); bombas de San Cayetano con generadores; sin evacuados | INA 2,45 (03Z); la nota da 2,50 | Ibarra y Ahumada: 2,57. **Coincide** | https://elcampanensediario.com/2023/12/19/el-municipio-realizo-un-operativo-de-monitoreo-y-prevencion-por-la-sudestada/ |
| 25/04/2016, Campana | Costanera, "bajo de la ciudad", calle Alem (foto); clases suspendidas en la Escuela Técnica "Luciano Reyes" | "A las 15 hs. el Paraná marcaba 2,45 metros" y seguía subiendo | INA 2,45 (15Z) | Tramos de Alem: desde 2,87; Alem y Berutti: 3,12. **El modelo inunda tarde**, o el agua entró por desagües | https://www.enlacecritico.com/campana/la-crecida-el-parana-en-campana/ |
| 02/07/2026, Campana | San Cayetano, calle Ibarra: agua en la calle y en la entrada de casas | Sudestada sin lluvia; el agua entró por zanjones y caños | PNA 1,20 (00 h) y 1,50 (12 h) | 2,57. **No representable**: el interior del barrio está a 1,1-1,7 m de DEM detrás del terraplén y el agua entró por conductos | https://www.campananoticias.com/noticia/94765/crecida-de-rio-mantuvo-en-vela-a-vecinos-del-barrio-san-cayetano |
| 13/08/2015, Campana | Costanera | "Parcial desborde del Paraná" que "cubrió gran parte de la zona costanera" | INA 1,85 (07Z); pico desconocido (en Zárate el prefecto informó 2,43 m y el INA guarda 1,65) | — | https://www.enlacecritico.com/campana/la-sudestada-en-campana/ |
| 25/03/2016, Zárate | Bajo de Villa Angus (bombeo), ex embarcadero del ferry, costanera | "Alcanzó en un momento los 2,40 mts"; trabajos para adelantarse a un desborde; sin evacuados | INA 2,40 (14-15Z) | Villa Angus: 2,69. **Coincide** (no desbordó) | https://www.enlacecritico.com/destacados/alerta-en-zarate-y-campana-por-la-nueva-crecida-del-parana-por-la-sudestada/ |
| 12/02/2019, Zárate | Paseo de la Ribera y zona del ex ferry | "La altura llegó a los 2,35 metros"; el caudal "había borrado algunos metros de la costa y el Paseo de la Ribera" | Nota 2,35; INA 2,20 (07Z) | El borde de la costa se conecta con el río a cualquier altura: no sirve para calibrar | https://www.diariolavozdezarate.com/2019/02/13/el-rio-parana-llego-a-superar-el-nivel-de-alerta/ |
| 18-19/09/2012, Zárate | Viejo puerto del ferry ("primer sector en desbordarse"); el agua "amenazaba con superar el estacado" del paseo costanero; Villa Angus con bombas | Pico "2,25 mts. a la medianoche"; sin evacuaciones | INA 2,15 (07Z) | — | https://www.enlacecritico.com/destacados/el-pico-maximo-de-crecida-del-rio-parana-estuvo-en-los-225-mts/ |
| 19/10/2016, Zárate | Ribera | "Estamos en 2,10, todavía lejos de la marca de riesgo": sin problemas (control negativo) | Nota 2,10 | — | https://www.enlacecritico.com/destacados/estado-del-rio-parana-de-las-palmas-en-zarate-y-la-sudestada-estamos-en-alerta-el-rio-sigue-creciendo-aunque-estamos-todavia-lejos-de-la-marca-de-riesgo/ |

En Zárate, con 2,10 m no se informan problemas; entre 2,20 y 2,40 m desbordan el ex ferry y el borde del Paseo de la
Ribera, y Villa Angus necesita bombeo. No apareció ninguna nota con calles del casco inundadas por el río. Para los
picos de 1983, 1998, 2000, abril de 2016 (Zárate), 2010 y 2023 (Zárate) no se encontraron notas con lugares.
**No sirven para calibrar** (lluvia): 2015, 01/11/2014 (mixto), 16/03/2024, mayo de 2025. El derrumbe de Costanera Sur
de Zárate del 30/04/2020 tampoco: el río estaba en 0,25 m.

### Geografía y área del modelo

Lo que se pudo verificar (OSM y DEM):

- **Nodos:** Campana `place=town` en −58,9587; −34,1637. Zárate `place=city` en −59,0245; −34,0955 (OSM).
- **Calles** (Overpass, percentiles 2 y 98 de calles residenciales a menos de 7 km de cada nodo): Campana lon −59,009 a
  −58,923 y lat −34,214 a −34,147; Zárate lon −59,082 a −58,994 y lat −34,139 a −34,073.
- **Río** (OSM, "Río Paraná de las Palmas"): pasa por −59,022; −34,076 → −59,009; −34,099 (puerto de Zárate) →
  −58,973; −34,118 → curva por −58,983; −34,134 → −58,962; −34,153 (puerto de Campana) → −58,928; −34,150 → −58,898;
  −34,184. Frente a cada ciudad la orilla norte son islas del Delta, del partido de cada ciudad (provincia de Buenos
  Aires): no hay límite provincial ni internacional en el área.
- **Relieve** (DEM, con vegetación y edificios): Zárate está sobre una barranca de 25 a 28 m, al borde del río; al pie
  queda una franja portuaria e industrial de 4 a 12 m. Campana está más baja: el casco va de 10 a 20 m y la barranca de
  20 a 28 m queda al sur (−34,17 en adelante). La costanera de Campana da 5 a 8 m. Las islas de enfrente dan 1 a 6 m
  (monte de sauces y álamos: el suelo está más bajo). Barrios bajos: San Cayetano (−59,006; −34,156; 2,3 m), al oeste
  de Campana sobre el arroyo La Cruz; los bajos al este de Siderca (−58,925; −34,165; ~3 m); al noroeste de Zárate, los
  bajos del arroyo Ñacurutú (−59,05; −34,065; ~3 m).
- **Cauce en el DEM:** franja de 200 a 400 m con −0,2 a −1,1 m (transectos cada 0,0005°); bordes de 3 a 10 m.

Propuesta:

| Campo | Campana | Zárate | Justificación |
|---|---|---|---|
| `bbox` [O, S, E, N] | **[−59.01, −34.19, −58.90, −34.125]** | **[−59.07, −34.125, −58.96, −34.060]** | 0,11° × 0,065°, como Itatí. Cada uno cubre el casco, la costanera, el puerto, los barrios bajos (San Cayetano y bajos de Siderca en Campana; franja portuaria y bajos del NO en Zárate), el cauce y 2 a 3 km de islas enfrente. Se tocan en lat −34,125 (el tramo de río entre las dos queda en Zárate). No se estiran hacia la barranca del sur ni hacia el oeste de Zárate (25-30 m, por encima de cualquier crecida). |
| `centro` | **[−58.958, −34.162]** | **[−59.025, −34.095]** | En el casco, a ~200 m del nodo OSM. |
| `zoom` | 13.4 | 13.4 | Mismo ancho que Itatí y Paso. |
| `semillasRio` | **[−58.960, −34.1528]** (−0,3 m, frente al puerto), **[−58.930, −34.150]** (−1,1 m, frente a Siderca), **[−58.975, −34.1315]** (−0,2 m, curva aguas arriba) | **[−59.018, −34.080]** (−0,7 m, aguas arriba del puerto), **[−59.0078, −34.100]** (−1,0 m, frente al puerto) | Centro de la franja más baja de cada transecto, en el cauce principal, más bajas que las dos orillas. |

Barrios de Campana que quedan afuera: Las Acacias, Siderca (barrio), Ariel del Plata, Las Campanas y Otamendi (sur y
sureste, lat −34,19 a −34,23). Están sobre la barranca o en los bajos del río Luján y del arroyo Otamendi; se inundan
por lluvia, no por el Paraná de las Palmas. Sumarlos llevaría el área a 0,11° × 0,1°.

### Rango del simulador

| | Campana | Zárate |
|---|---|---|
| `simulador` | **0,40 a 3,10 m**, de a 0,05 | **0,40 a 3,40 m**, de a 0,05 |
| Mínimo | 1,8 m bajo la alerta; igual a la lectura actual (0,40 m) | 1,8 m bajo la alerta |
| Máximo | Cubre la sudestada de 2000 (3,00 m) | Cubre 1983 (3,30 m) |
| `nivelesZonas_m` | 0,4 a 3,1, paso 0,1 (28 niveles) | 0,4 a 3,4, paso 0,1 (31 niveles) |

No se baja a valores negativos: en aguas bajas (−0,4 a −0,75 m) el agua queda dentro del cauce y no aporta al mapa.
Si el río baja de 0,40 m, el simulador queda en su mínimo.

### Vista previa (`vista-previa.mjs`, SRTM sin corregir)

| Altura | Campana | Zárate |
|---|---|---|
| Lectura actual | 0,40 m: 72 ha | 0,81 m: 90 ha |
| Alerta (2,20) | 248 ha | 249 ha |
| Evacuación | 2,45 m: 265 ha | 2,40 m: 260 ha |
| Sudestada 2023 | 2,45 m: 265 ha | 2,60 m: 270 ha |
| 2016 | 2,65 m: 280 ha | 2,85 m: 503 ha |
| 1998 | 2,70 m: 282 ha | 2,95 m: 523 ha |
| 1983 | 2,72 m: 285 ha | 3,30 m: 569 ha |
| Sudestada 2000 / máximo | 3,00 m: 303 ha; 3,10 m: 309 ha | 3,40 m: 577 ha |
| Centro | 15,3 m: seco | 27,2 m: seco |

Las hectáreas crecen con la altura y los cascos quedan secos. Las semillas dan entre −1,1 y −0,2 m (agua). La superficie
es chica para el Delta porque el SRTM mide la copa del monte de las islas (3 a 6 m) y los techos de la costa (la
costanera de Campana da 7 m): el relieve de `procesar.py`, con la corrección por cobertura, va a dar más agua. En
Zárate, entre 2,60 y 2,85 m se conecta un bajo grande de islas (de 270 a 503 ha).

### Avisos del Delta (para el informe y, si se decide, para la interfaz)

- **Marea y sudestada:** en el Paraná de las Palmas el nivel sube y baja dos veces por día por la marea del Río de la
  Plata, y una sudestada lo levanta 1 a 2 m en horas. Los picos de 2000 y 2023 duraron un día.
- **Dato cada 12 h:** Prefectura publica Campana y Zárate a las 00 y a las 12. Entre dos datos el río puede haber
  subido o bajado más de medio metro. El INA guarda en general una lectura por día.
- **Islas:** buena parte del área son islas habitadas (casas sobre pilotes, muelles). El modelo no sabe la altura de
  las viviendas ni de los terraplenes de las islas.
- **Lluvia:** las inundaciones urbanas más grandes de la última década (2015 y 2025) fueron por lluvia, con el río bajo.
  El mapa no las representa.
- **Crecida del Paraná:** una crecida grande aguas arriba (como la de octubre de 2026 en el NEA) llega amortiguada al
  Delta: en 1983 y 1998 Campana se mantuvo semanas cerca de 2,7 m.

### Datos faltantes

Resueltos el 21/10/2026: el sistema de referencia de los ceros (cero IGN, nivelación IGN-INA de 2016, INA-C) y los
umbrales vigentes de Zárate (2,20 / 2,40 de Prefectura). Ya no hace falta la lectura de Zárate de 2000-2005: servía
para el control contra el SRTM, que el modelo no usa.

1. **Cotas de coronamiento de las defensas** (lo que más cambiaría el mapa): tablestacado de Costanera Sur de Zárate y
   borde del Paseo de la Ribera; dique de Villa Angus; terraplenes de San Cayetano, Ibarra y Ahumada, Santa Lucía;
   compuertas de Santa Lucía y Euroamérica. Obras Públicas de cada municipio. Del tablestacado también sirve el informe
   INA SLH 02-406-23 (enero de 2023), que no se pudo bajar del repositorio del INA.
2. **MDE 5 m del IGN** (IGN-M, vuelo del 28/02/2015; también MDT 5 m "según disponibilidad"): cubre las dos ciudades.
   Se pide a asesoriatecnica@ign.gob.ar con el polígono y el uso. Atribución obligatoria: "FUENTE: Instituto
   Geográfico Nacional de la República Argentina". Con él se reprocesa con `procesar.py <id> --dem`.
3. Partes de Defensa Civil de las sudestadas de 2023, 2016, 2010 y 1998: calles con agua y hora.
4. Protocolo de evacuación (barrios por altura) y centros de evacuados: FALTANTE en las dos.
5. Escala de Zárate: si se cambió o se volvió a nivelar después de 2016 (estaba "en mal estado") y si eso explica el
   salto de +0,15 m contra Campana desde diciembre de 2024 (Prefectura o INA). También el cambio de cero de los años
   90, sin documentar.
6. Sistema de las cotas de la red en 2016 (SRVN71 o SRVN16): el IGN da las SRVN71 a pedido (scimbaro@ign.gob.ar).
7. Aguas bajas de Campana (null en el INA).
8. Pronóstico de corto plazo publicable para Zárate (el modelo del Delta del INA sólo da Campana).

### Filas del catálogo

| Localidad | Provincia | Río | Puerto PNA | Estación / serie INA | Cero IGN (m) | Coordenadas (lon; lat) | Alerta / evacuación (m) | Estado |
|---|---|---|---|---|---|---|---|---|
| **Zárate** | Buenos Aires | Paraná de las Palmas (PNA: Delta Paraná) | **ZARATE** | **40 / 40** (sin datos 2000-2005) | **0,243** | **−59,0109; −34,0988** | **2,20 / 2,40** (INA: 2,00 / 2,20) | **activa** |
| **Campana** | Buenos Aires | Paraná de las Palmas (PNA: Delta Paraná) | **CAMPANA** | **41 / 41** | **0,418** | **−58,9582; −34,1556** | **2,20 / 2,45** | **activa** |

Vecinos relevados (INA-E y PNA del 21/10/2026), por si se suman después:

| Localidad | Provincia | Río | Puerto PNA | Estación / serie INA | Cero IGN (m) | Coordenadas (lon; lat) | Alerta / evacuación (m) | Estado |
|---|---|---|---|---|---|---|---|---|
| San Pedro | Buenos Aires | Paraná (INA: PARANAINF) | SAN PEDRO | 38 / 38 | 0,714 | −59,6497; −33,6745 | 3,40 / 3,60 | catálogo |
| Baradero | Buenos Aires | Baradero (riacho) | BARADERO | 39 / 39 | 0,641 | −59,4956; −33,8007 | 2,70 / 3,10 | catálogo |
| Escobar | Buenos Aires | Paraná de las Palmas | ESCOBAR | 42 / 42 | FALTANTE | −58,7333; −34,3 (≈) | 3,00 / 3,50 | catálogo |
| Ibicuy | Entre Ríos | Paraná Ibicuy | IBICUY | 45 / 45 | 0,456 | −59,1801; −33,7620 | 2,00 / 2,30 | catálogo |
| Guazucito | Buenos Aires | Paraná Guazú | GUAZUCITO | 48 / 48 | 0,447 | −58,4; −34,0167 (≈) | 2,20 / 2,40 | catálogo |
| Tigre | Buenos Aires | Luján | FALTANTE (no relevado en PNA) | 49 / 49 | −0,099 | −58,5780; −34,4159 | 3,30 / 3,80 (INA) | catálogo |
| San Fernando | Buenos Aires | Luján (PNA: Delta Paraná) | SAN FERNANDO | 52 / 52 | −0,53 | −58,55; −34,4333 (≈) | 3,00 / 3,50 | catálogo |
