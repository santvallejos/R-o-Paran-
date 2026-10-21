# Cota del cero del hidrómetro

```
cota_agua (m) = altura_hidrometro (m) + cotaCero_m
```

Prefectura publica la altura medida desde el cero de la escala del hidrómetro, no sobre el nivel del mar. La app la
convierte con `cotaCero_m` para compararla con el relieve. Un error en el cero corre la mancha de agua entera: es el
dato que más incertidumbre mete en el modelo, por encima de la altura y casi a la par del relieve.

El cero tendría que estar en el mismo sistema de alturas que el DEM (Copernicus GLO-30 usa EGM2008). El INA publica
`cero_ign` sin decir en qué sistema está. Hasta ahora: en Paso de la Patria el SRTM y el cero interpolado coinciden
en decímetros; en Itatí el agua del DEM queda ~0,76 m por debajo de la que da el cero IGN. Esa diferencia se
documenta, no se corrige sin dato oficial (ver `MEJORAS-DATOS.md`, punto 2).

Antecedente completo y tablas de Paso de la Patria en `docs/calibracion.md`.

## Contenido

- [Caso A: el INA publica el cero](#caso-a-el-ina-publica-el-cero)
- [Caso B: el puerto no tiene cero publicado](#caso-b-el-puerto-no-tiene-cero-publicado)
- [Caso C: zona sin hidrómetro propio](#caso-c-zona-sin-hidrómetro-propio)
- [Métodos descartados](#métodos-descartados)

## Caso A: el INA publica el cero

1. `cotaCero_m` = `cero_ign` de la estación (`/obs/puntual/estaciones?tabla=alturas_prefe`).
   `cotaCeroProvisoria: false`.
2. Control contra el DEM: pedí la lectura de la serie para el **12/02/2000** (pasada del SRTM) y muestreá el pelo de
   agua del DEM Terrarium frente al puerto (ver [fuentes-datos.md](fuentes-datos.md#dem-terrarium)).
   `diferencia = agua_DEM − (lectura_12/02/2000 + cero_ign)`.
3. Anotá la diferencia en `notaCalibracion` y en la ficha (como Itatí: "contra el relieve, el agua del río queda unos
   0,8 m por encima del DEM"). Hasta ~1 m es esperable. Si supera ~1,5 m, sospechá antes de cargar: coordenadas de la
   estación redondeadas, una muestra que no cayó en el cauce principal o un cero en otro sistema. Informalo.

## Caso B: el puerto no tiene cero publicado

### Interpolación entre hidrómetros vecinos (preferido)

Hace falta un hidrómetro con `cero_ign` aguas arriba (A) y otro aguas abajo (B) de la localidad X, sobre el mismo
río y sin confluencias grandes en el medio.

1. Fracción del tramo: `f = d(A, X) / d(A, B)`, medida a lo largo del río (en línea recta si el tramo es casi recto;
   para Paso de la Patria: 34,2 / (34,2 + 29,0) = 0,54).
2. Para cada fecha con lecturas de A, B y X **a la misma hora**:

   ```
   agua_X = (h_A + cero_A) + f × ((h_B + cero_B) − (h_A + cero_A))
   cero_X = agua_X − h_X
   ```

3. Repetilo con al menos dos fechas de niveles muy distintos (una de la crecida actual y otra de aguas medias o
   bajas, p. ej. el 12/02/2000). Si coinciden en ±0,1 m, promediá y redondeá a 0,01 m. Si no coinciden, la pendiente
   no es uniforme en el tramo (confluencia, riacho, represa): no lo cargues sin consultarlo con el usuario.
4. `cotaCeroProvisoria: true`, y en `notaCalibracion` el método en una oración ("Estimado con los hidrómetros del INA
   de A y B (cero IGN), interpolando la pendiente del río. A confirmar con el dato oficial."). La tabla de fechas va
   en la ficha de `docs/localidades-nea.md`.
5. Control: el pelo de agua del SRTM frente a X el 12/02/2000 tendría que parecerse al `agua_X` interpolado de ese
   día (en Paso: ~47 m contra 46,91 m).

### Sin vecinos con cero: pelo de agua del SRTM (último recurso)

`cero_X ≈ agua_DEM_SRTM(frente al puerto) − h_X(12/02/2000)`.

La incertidumbre es alta (±1 m o más: error vertical del SRTM y superficie de agua aplanada). Explicale al usuario
que el mapa de esa localidad va a ser una aproximación gruesa y preguntá si quiere seguir. Si sigue: provisorio, y
la nota dice que el cero sale del relieve satelital.

## Caso C: zona sin hidrómetro propio

La zona X muestra la lectura `h_A` del puerto vecino A, así que su cero se expresa sobre la escala de A:

```
agua_X = h_A + cero_A + Δ
Δ      = f × ((h_B + cero_B) − (h_A + cero_A))      (B: el otro hidrómetro que encierra a X)
cotaCero_m(X) = cero_A + Δ_promedio
```

- `f` es la fracción del tramo A→B hasta X, como en el caso B. Aguas abajo de A, Δ es negativo (el agua está más baja).
- Calculá Δ con lecturas simultáneas de A y B en varias fechas y niveles. Δ cambia un poco con la altura del río:
  informá el rango, no sólo el promedio.
- Preferí un par A–B con cero IGN. Si el vecino más cercano tiene un cero provisorio (como Paso de la Patria, 44,0 m),
  usá el par con cero IGN que encierre a X y explicalo.
- Si X queda fuera de todo par (aguas arriba del primero o abajo del último), extrapolá con la pendiente del par más
  cercano y marcalo en la nota.
- Siempre `cotaCeroProvisoria: true`. La `notaCalibracion` dice qué hidrómetro se usa como referencia y cómo se corrigió
  por pendiente.

## Métodos descartados

- **Pelo de agua de Copernicus GLO-30**: Copernicus aplana y edita los cuerpos de agua; su "nivel del río" no es una
  medición. En Paso de la Patria daba 45,0 m cuando el agua real estaba en ~48 m, y llevó a un cero de 40,5 m que hubo
  que descartar.
- **Ajustar el cero para que coincida con las noticias** (familias evacuadas, calles anegadas): que haya pocos
  evacuados no prueba que el agua no llegue (casas de fin de semana, viviendas sobreelevadas). Las noticias sirven
  para validar el resultado, no para calibrar el cero.
