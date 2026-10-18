# Calibración del modelo

## La cota del cero del hidrómetro

```
cota_agua (m) = altura_hidrometro (m) + cota_cero (m)
```

Valor actual en `shared/localidades/paso-de-la-patria.ts`: **44,00 m, provisorio**.

Cómo se estimó: el DEM (SRTM, febrero de 2000) registra el pelo de agua del Paraná frente a Paso de la Patria en ~47 m.
Suponiendo que ese día el río marcaba ~3 m en la escala, el cero queda en ~44 m. Es una suposición: hay que reemplazarla.

### Cómo mejorarlo

1. **Dato oficial** (lo mejor): pedir a INA, Prefectura o Vías Navegables la cota del cero del hidrómetro del puerto
   de Paso de la Patria y en qué sistema de alturas está. El DEM actual usa alturas sobre el geoide EGM96;
   si el dato oficial está en otro sistema (p. ej. IGN), sumar la diferencia.
2. **Altura del río el día del SRTM**: con la lectura del 11–22/02/2000 (historial del INA), `cota_cero = 47 − lectura`.
3. **Satélite**: elegir una imagen Sentinel-1 con altura conocida, probar valores con `?cero=` y quedarse con el que
   mejor coincida con el borde del agua.
4. **Puntos de control**: fotos con GPS ("acá llegó el agua con 7,20 m") para ajustar fino.

En la app, "Cómo se calcula" permite cambiar el valor en vivo para comparar.

## Otros ajustes

- `semillasRio`: deben caer dentro del cauce en el DEM. Si quedan en tierra, el modelo inunda de más.
- Defensas y terraplenes: hoy no se modelan (el DEM de 30 m no los ve). Próximo paso: rasterizar las líneas
  de defensa como celdas muy altas antes de correr el algoritmo.
