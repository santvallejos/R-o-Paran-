# Calibración del modelo

## La cota del cero del hidrómetro

```
cota_agua (m) = altura_hidrometro (m) + cota_cero (m)
```

Valor actual en `shared/localidades/paso-de-la-patria.ts`: **44,00 m, provisorio**.

Cómo se estimó: el SRTM (febrero de 2000) registra el pelo de agua del Paraná frente a Paso de la Patria en ~47 m,
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
