---
name: agregar-localidad
description: Guía para sumar al mapa de crecida del río Paraná una localidad, ciudad, pueblo, paraje, barrio o zona/área nueva (shared/localidades), o para ampliar o mover el área de una ya cargada (bbox, semillas del río, centro). Cubre relevar los datos con fuente (Prefectura, INA, OSM, DEM), estimar la cota del cero del hidrómetro, armar la configuración, registrarla, generar la migración de Supabase, procesar el relieve y verificar. Usala siempre que el usuario quiera agregar, sumar, cargar, dar de alta o modelar un lugar nuevo (p. ej. "agregá Goya", "quiero ver Ramada Paso en el mapa", "sumemos Empedrado"), cambiar el área de una localidad existente, o pregunte qué datos hacen falta para una localidad nueva, aunque no use la palabra "localidad".
---

# Agregar una localidad, zona o área

Este proyecto muestra qué zonas se inundan a cada altura del río. Es **educativo y sin fines de lucro**: lo que
muestra son estimaciones y no reemplaza a Prefectura, el INA, el municipio ni Defensa Civil. Una localidad mal
cargada puede mostrar como seco un barrio que se inunda, o al revés, y alguien puede tomar decisiones con eso. Por
eso el trabajo de esta skill es, sobre todo, **conseguir cada dato con su fuente** y dejar a la vista lo que no se
pudo confirmar.

## Principios

- **Cada valor lleva su fuente** (URL o documento, y fecha de consulta). Van en el `.ts` de la localidad, en
  `docs/localidades-nea.md` y en el informe final.
- **Lo que no se consigue se marca `FALTANTE`** y se informa. No completes con un valor "razonable" sin decirlo: un
  número inventado en la cota del cero mueve toda la mancha de agua.
- **Un cero estimado es provisorio**: `cotaCeroProvisoria: true` y una `notaCalibracion` que explique cómo se obtuvo
  (el panel la muestra al usuario final).
- **Lo local se hace sin preguntar; lo externo, no.** Investigar, escribir archivos, correr tests y `procesar.py`
  sin `--subir` es seguro. Aplicar cosas en Supabase, subir a Storage, commitear o pushear necesita el sí explícito
  del usuario: un push a `claude/mvp-paso-de-la-patria` publica a producción (Vercel).
- **Sumar una localidad es configuración y datos, no código.** Si en el camino aparece un bug o una mejora de la app
  (p. ej. que el panel diga dónde se mide la altura), describilo en el informe y proponelo como cambio aparte; no lo
  mezcles con el alta.
- **Ningún dato personal sale en las consultas.** Para OSM y demás servicios usá el `User-Agent`
  `mapa-crecida-parana (proyecto informativo sin fines de lucro)`, el mismo de `api/_prefectura.ts`. Nunca el email
  ni el nombre del usuario, aunque los tengas en contexto: una vez enviados quedan en servidores de terceros.

## Paso 0: identificar el caso

Antes de investigar, buscá el lugar en `docs/localidades-nea.md`. El catálogo tiene unas 40 estaciones del NEA con
puerto de Prefectura, id de estación/serie del INA, cero IGN, coordenadas y umbrales, cada uno con fuente. Revisá
también los `bbox` de `shared/localidades/*.json`: si el lugar ya cae dentro del área de una localidad cargada, no
hace falta crear otra (es el caso D o ya está cubierto).

Contrastá lo que dice el usuario con OSM y el relieve antes de diseñar el área. Pasa que "un paraje sobre el río"
sea un pueblo en la meseta a 10 km de la costa, o que el puerto esté sobre un riacho y no sobre el cauce principal.
Si no coincide, decilo en el informe y armá el área para lo que realmente hay ahí (o preguntá si es otro lugar).

| Caso | Situación | Ejemplos | Cero del hidrómetro |
|---|---|---|---|
| **A** | Puerto en Prefectura con `cero_ign` en el INA | Itá Ibaté, Corrientes, Empedrado, Bella Vista, Goya, Esquina | El del INA |
| **B** | Puerto en Prefectura sin `cero_ign` | Paso de la Patria y la mayoría del catálogo | Estimado e informado como provisorio |
| **C** | Lugar sin hidrómetro propio | Un paraje o barrio costero entre dos puertos | El del puerto vecino, corregido por pendiente |
| **D** | Ampliar o mover el área de una localidad existente | Sumar un barrio bajo que quedó afuera | No cambia |

Para A, B y C seguí los pasos 1 a 8. Para D andá directo a [Caso D](#caso-d-ampliar-o-mover-un-área).

## Paso 1: relevar los datos

Detalle de cada consulta (URLs, parámetros y cómo leer las respuestas) en
[references/fuentes-datos.md](references/fuentes-datos.md).

| Campo | De dónde sale |
|---|---|
| `puertoPrefectura` | Nombre **exacto** de la columna "Puerto" de la tabla de Prefectura. La API, la Edge Function y el mapa regional buscan la fila por ese texto; si no coincide, la localidad queda sin altura. |
| `ina.serieAltura` | Para las estaciones de Prefectura, el id de la serie de altura coincide con el id de estación del INA. |
| `hidrometro.cotaCero_m` | Paso 2. |
| `umbrales` | Alerta y evacuación de la tabla de Prefectura (la Edge Function los mantiene al día con los oficiales). |
| `crecidasHistoricas` | Máximos de la serie del INA (1983, 1998, 2015-16, 2023 y lo que destaque). Fecha del pico, no del año. |
| `pronostico` | Sólo uno oficial de corto plazo (SAH-INA o municipio). El modelo estacional del INA no sirve: no lo cargues. Si no hay, se omite el campo. Un pronóstico vence en días y el panel lo muestra como "pico pronosticado": si lo cargás, decí en el informe hasta cuándo vale y que se actualiza en Supabase (`localidades.pronostico`) sin redeploy. Si nadie lo va a mantener, es mejor no cargarlo. |
| `centro`, `bbox`, `semillasRio` | Paso 3. |
| `rio`, `provincia`, `nombre` | Catálogo / OSM. `rio` aparece en el título de la página. |
| `region` | Id de `shared/localidades/regiones.json` (`nea`, `bajo-parana`, …): agrupa el selector y el mapa regional. Si la localidad abre un tramo nuevo del río, sumar la región ahí, en su orden aguas abajo. |

## Paso 2: cota del cero del hidrómetro

`cota_agua = altura_hidrometro + cotaCero_m`. Es el dato que más mueve el resultado: 0,5 m de error en el cero
equivalen a simular el río 0,5 m más alto o más bajo en todo el mapa. Métodos para cada caso (A, B, C), fórmulas y
controles contra el DEM en [references/cota-del-cero.md](references/cota-del-cero.md).

## Paso 3: área del modelo

- **`bbox` [oeste, sur, este, norte]**: el casco, la costanera, los barrios bajos y el cauce hasta la otra orilla.
  Para un pueblo, del orden de 0,11° × 0,06° (como Paso de la Patria e Itatí, con `zoom` 13.4). No lo estires hacia
  mesetas que no se inundan con ninguna crecida registrada: el modelo, los tiles y la vista 3D crecen con el área
  (un pueblo pesa ~10 MB; una ciudad, 50–150 MB).
- **`centro`**: en el casco urbano, dentro del bbox.
- **`semillasRio`**: 1 a 3 puntos en el centro del cauce principal, **del lado argentino** y dentro del bbox. La
  inundación se propaga sólo desde ahí, así que una semilla sobre tierra o en una laguna aislada arruina el modelo.
  Verificalas con el DEM: el agua aparece plana (mismo valor en celdas vecinas) y más baja que las orillas. El límite
  internacional suele pasar cerca de la costa argentina; un punto "en el medio del río" puede estar en Paraguay.
  En riachos o brazos angostos el SRTM suele medir la copa de los árboles de la orilla y no el agua: ahí poné las
  semillas en el cauce principal conectado, aunque el hidrómetro esté sobre el riacho.
- Usá OSM (calles, barrios) para justificar los bordes y anotá la justificación en la ficha.

Para mirar el relieve sin instalar nada, la skill trae `scripts/dem.mjs` (Node, sin dependencias; los tiles quedan
en la carpeta temporal):

```bash
S=.claude/skills/agregar-localidad/scripts
node $S/dem.mjs punto -58.245 -27.256 -58.275 -27.256      # altura en puntos (semillas candidatas)
node $S/dem.mjs grilla -58.30 -27.30 -58.19 -27.245 0.0025 # tabla de alturas del área
node $S/dem.mjs ns -58.245 -27.245 -27.30 0.0025           # transecto río → pueblo
```

## Paso 4: archivos

Seguí el patrón de Itatí, que es el ejemplo completo:

1. **`shared/localidades/<id>.json`**: copiá `itati.json` y cambiá lo propio. `id` en minúsculas, números y guiones
   (sin acentos: lo exige Supabase). `dem`, `procesamiento` y `fuentes` quedan iguales salvo motivo.
   - `simulador`: `min_m` ≈ 1,5–1,8 m por debajo de la alerta; `max_m` ≥ el pico histórico más alto (para poder
     simularlo); `paso_m` 0.05.
   - `procesamiento.nivelesZonas_m`: tiene que cubrir todo el simulador (lo controla la validación), con paso 0.1.
2. **`shared/localidades/<id>.ts`**: igual que `itati.ts`, con `import datos from './<id>.json' with { type: 'json' }`
   y un comentario que diga de dónde sale cada valor (cero, bbox y semillas, umbrales, crecidas).
3. **Registro en `shared/localidades/index.ts`**: import con extensión `.js` y entrada en `localidades`. Las funciones
   de `api/` corren como ESM de Node sin empaquetar: sin la extensión o sin el `with`, la API falla en producción
   aunque todo ande en `npm run dev`.
4. **`public/data/nivel/<id>.json`**: respaldo manual con la última lectura de Prefectura (mismo formato que
   `public/data/nivel/itati.json`, `modo: "manual"`). La app lo usa si fallan la API y Supabase.
5. **`docs/localidades-nea.md`**: actualizá la fila del catálogo (estado "activa") y, si hubo investigación nueva,
   agregá una ficha como la de Itatí (hidrómetro, crecidas, área propuesta con justificación, datos faltantes).

## Paso 5: verificar local

```bash
npm test            # validar.test.ts corre validarLocalidad() sobre todas las registradas
npm run typecheck
```

La validación controla bbox, centro y semillas dentro del área, rango del simulador, umbrales alcanzables, serie del
INA, cota del cero numérica y que las zonas cubran el simulador. Si falla, corregí el JSON: no relajes la validación.

`test/api-estado.test.ts` compara la lista exacta de localidades que devuelve `/api/estado` para una tabla de
Prefectura de prueba con las filas `ITATI` y `PASO DE LA PATRIA`. Si la localidad nueva usa uno de esos puertos (caso
C), el test falla hasta que sumes su entrada esperada; es el único test que hay que tocar.

Después, la vista previa del modelo con el mismo cálculo que hace la app sin relieve procesado:

```bash
node .claude/skills/agregar-localidad/scripts/vista-previa.mjs <id>
```

Muestra la altura de cada semilla (avisa si alguna parece estar sobre tierra), el pelo de agua del DEM pasado a
altura de hidrómetro, a partir de qué altura se inunda el centro y, para umbrales, crecidas históricas y la última
lectura, las hectáreas y el recuadro que alcanza el agua. Revisá que tenga sentido: las hectáreas crecen con la
altura, el agua llega a los barrios que se inundaron en crecidas anteriores y el casco alto queda seco. Sirve para
corregir bbox y semillas antes de procesar, no como resultado final: el SRTM incluye árboles y techos, y en la costa
poblada suele quedar corto.

Si podés abrir un navegador, `npm run dev` y `http://localhost:5173/?localidad=<id>` muestran lo mismo en el mapa.
La vista 3D necesita el relieve procesado (paso 7).

## Paso 6: migración de Supabase

La fila de `public.localidades` se genera desde el JSON (la fuente de verdad); no se escribe a mano:

```bash
node scripts/sql-localidad.ts <id> > supabase/migrations/<AAAAMMDDhhmmss>_<id>.sql
```

- El timestamp tiene que ser posterior a la última migración de `supabase/migrations/`.
- Necesita Node 23.6+ (con Node 22, `node --experimental-strip-types`).
- En Windows corré el comando desde Git Bash: el `>` de PowerShell 5 escribe UTF-16 y Postgres no lo lee.
- Sumá la misma fila a `supabase/seed.sql`, con `on conflict (id) do nothing` y un comentario de una línea, como las
  de Paso de la Patria e Itatí.

Esto sólo crea archivos. Aplicarla en Supabase es el paso 8.

## Paso 7: relieve (local)

Desde `procesamiento/` con el entorno de Python (3.11+; en Windows con Git Bash el venv se activa con
`.venv/Scripts/activate`):

```bash
pip install -r requirements.txt     # la primera vez
python procesar.py <id>
```

Baja Copernicus GLO-30, la máscara de agua, ESA WorldCover y los edificios de Overture (necesita red; tarda
minutos) y escribe `public/data/relieve/<id>/` y `procesamiento/salida/<id>/version.json`. Revisá el log:

- **Pelo de agua del DEM**: tiene que equivaler a una altura de hidrómetro plausible para 2011–2015 (el período de
  Copernicus). Si da negativo o muy por encima de la alerta, revisá el cero o las semillas.
- **Hectáreas por nivel**: tienen que crecer con la altura y ser coherentes con lo que se sabe de crecidas
  anteriores (barrios evacuados, noticias).
- **Peso** de `public/data/relieve/<id>/`: si supera unas decenas de MB, comentale al usuario la opción de servirlo
  desde Supabase Storage (`--subir-archivos` + `VITE_RELIEVE_BASE`, ver `docs/supabase.md`).

Si no hay entorno de Python o red, dejá el comando listo en el informe y seguí: la app funciona sin relieve procesado.

## Paso 8: lo que necesita confirmación

Mostrale al usuario la lista exacta de comandos y esperá su sí antes de cada grupo:

1. **Aplicar la migración** en Supabase (`supabase db push`, o pegar el SQL en el SQL Editor). Desde ese momento la
   Edge Function `registrar-nivel` empieza a registrar las alturas de la localidad.
2. **Cargar las zonas**: `python procesar.py <id> --subir` (o `--solo-subir-archivos --subir` si ya está procesado).
   Con `--subir-archivos`, además sube la carpeta al bucket `relieve`. Necesitan `SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY` en el entorno; esa clave no va nunca al repo ni al frontend.
3. **Commit y push**: mensaje en castellano, título descriptivo y cuerpo con viñetas, como los del historial. El push
   publica en producción.

## Caso C: zona sin hidrómetro propio

La zona usa la lectura de un puerto vecino. Elegí el más cercano que publique seguido (cada 2 h) y, si se puede, con
cero IGN.

- `puertoPrefectura`, `umbrales` e `ina.serieAltura` son **los del puerto vecino**: la altura que muestra la app está
  en la escala de ese hidrómetro, así que los umbrales tienen que estar en la misma escala. La Edge Function
  registra la lectura del vecino para esta zona y le pisa los umbrales con los oficiales del vecino, lo cual es
  consistente.
- `hidrometro.nombre`: deja claro que es el del vecino (p. ej. "Hidrómetro del puerto de Itatí (referencia)").
- `cotaCero_m`: el cero del vecino más la corrección por la pendiente del río hasta la zona
  ([references/cota-del-cero.md](references/cota-del-cero.md#caso-c-zona-sin-hidrómetro-propio)). Siempre
  provisorio, con la explicación en `notaCalibracion`.
- `crecidasHistoricas`: las de la serie del vecino (misma escala).
- Limitación a informar: el panel muestra la altura sin decir dónde se midió; `hidrometro.nombre` aparece sólo en
  "Más info" y `notaCalibracion` junto a la cota del cero. Mencionalo en el informe. Si el usuario quiere que la
  altura diga "en <vecino>", es un cambio de la interfaz aparte, no parte del alta.

## Caso D: ampliar o mover un área

1. Editá `bbox`, `semillasRio` y, si hace falta, `centro`/`zoom` en el JSON. Si sólo cambian `centro` o `zoom`, es
   un cambio de vista: no hace falta reprocesar.
2. `npm test` para validar.
3. Antes de reprocesar, borrá:
   - `procesamiento/cache/<id>/`: los mosaicos (DEM, agua, cobertura, edificios) se guardan uno por localidad, sin
     mirar el bbox. Si no los borrás, el procesamiento reusa los del área vieja y el borde nuevo queda sin datos.
   - `public/data/relieve/<id>/terreno/`: si el área se mueve o achica, quedan tiles viejos que no se pisan.
4. `python procesar.py <id>` y revisá el log como en el paso 7.
5. No hace falta migración: el bbox no está en Supabase. Las zonas sí: `procesar.py <id> --subir` carga una versión
   nueva y la deja activa (paso 8, con confirmación).

## Informe final

Terminá con un informe para el usuario, en este orden:

1. **Caso** (A, B, C o D) y `id`.
2. **Valores cargados**: tabla con campo, valor y fuente (URL y fecha), incluida la cota del cero y su método.
3. **Faltantes**: lo marcado `FALTANTE` o provisorio y a quién pedírselo.
4. **Archivos tocados**.
5. **Verificación**: resultado de `npm test` y `npm run typecheck`, y log resumido de `procesar.py` si se corrió.
6. **Pendiente con confirmación**: los comandos del paso 8 que todavía no se ejecutaron.
