# Calibración del modelo

## La cota del cero del hidrómetro

```
cota_agua (m) = altura_hidrometro (m) + cota_cero (m)
```

Valor actual (en `shared/localidades/paso-de-la-patria.json` y en Supabase): **40,50 m, preliminar** (antes 44,00 m).

### Calibración por impactos observados (18/10/2026)

Al cruzar los 9.812 edificios de Overture Maps con el modelo, se vio que 44 m no se sostenía.

| Cero (m) | Edificios con agua a 7,33 m | A 8,00 m | Pelo de agua del DEM (45 m) en la escala |
|---|---|---|---|
| 44,0 | 4.749 | 5.948 | 1,0 m |
| 42,0 | 606 | 1.510 | 3,0 m |
| 41,0 | 213 | 467 | 4,0 m |
| **40,5** | **134** | **295** | **4,5 m** |
| 40,0 | 101 | 150 | 5,0 m |

Con el río entre 7,15 y 7,33 m (17–18/10), Defensa Civil registraba en Paso de la Patria **una sola familia
evacuada (4 personas)**, y el municipio preveía hasta 25 familias a reubicar. Con 44 m, el modelo ponía agua en
la mitad del pueblo. Con 40,5 m la deja en ~130 edificios, casi todos sobre la costa e islas, que son quintas y
casas de fin de semana. Además, un pelo de agua de ~4,5 m en la escala es razonable para el río medio de
2011–2015 (fechas de Copernicus).

**Esto no reemplaza el dato oficial.** Es el valor que mejor coincide con lo observado.

### Estimación inicial (descartada)

El primer valor (44 m) salió de esto: el SRTM (febrero de 2000) registra el pelo de agua del Paraná frente a Paso de la Patria en ~47 m,
y Copernicus GLO-30 (2011–2015) en 45,00 m. Con 44 m, eso equivale a ~3 m y ~1 m en la escala, alturas plausibles
para esas épocas. Es una suposición con un margen de ±1–2 m: hay que reemplazarla por el dato oficial.

### Cómo mejorarlo

1. **Dato oficial** (lo mejor): pedir a INA, Prefectura o Vías Navegables la cota del cero del hidrómetro del puerto
   de Paso de la Patria y en qué sistema de alturas está. El DEM actual usa alturas sobre el geoide EGM96;
   si el dato oficial está en otro sistema (p. ej. IGN), sumar la diferencia.
2. **Altura del río en la fecha del DEM**: con la lectura del 11–22/02/2000 (historial del INA), `cota_cero = 47 − lectura`.
   Para Copernicus, el pelo de agua es una edición sobre varias pasadas: sirve menos.
3. **Satélite**: elegir una imagen Sentinel-1 con altura conocida, probar valores con `?cero=` y quedarse con el que
   mejor coincida con el borde del agua.
4. **Puntos de control**: fotos con GPS ("acá llegó el agua con 7,20 m") para ajustar fino.

En la app, "Cómo se calcula" permite cambiar el valor en vivo para comparar. Cuando se confirme:
actualizar `cota_cero_m` y `cota_cero_provisoria = false` en `localidades` de Supabase (la app lo toma al instante),
el JSON de la localidad y volver a correr `procesar.py --subir` (las zonas guardadas dependen de este valor).

## Umbrales oficiales

Prefectura publica para Paso de la Patria **alerta 6,50 m y evacuación 7,00 m**. La Edge Function los mantiene
al día en `localidades.umbrales`.

## Otros ajustes

- `semillasRio`: deben caer dentro del cauce en el DEM. Si quedan en tierra, el modelo inunda de más.
- Defensas y terraplenes: cargarlos en la tabla `defensas` (o en `procesamiento/datos/<id>/defensas.geojson`) y reprocesar.
  Se rasterizan como barreras.
- Corrección por cobertura (`correccionCobertura_m`): hoy árboles 3 m, arbustos 1 m, edificado 2 m. Con puntos de
  control se puede ajustar.
