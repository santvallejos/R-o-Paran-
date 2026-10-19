-- Cota del cero del hidrómetro de Paso de la Patria: 40,5 → 44,0 m (sigue siendo provisoria).
-- Estimada con los hidrómetros del INA vecinos que sí tienen cero IGN: Itatí (45,66 m) y Corrientes (42,39 m).
-- Interpolando el pelo de agua al 54 % del tramo, el cero da 44,03 m (18/10/2026) y 43,93 m (12/02/2000).
-- Descarta la calibración por edificios (40,5 m), que se apoyaba en el pelo de agua editado de Copernicus.
-- Ver docs/calibracion.md. Después de aplicar, regenerar las zonas con `procesar.py paso-de-la-patria --subir`.
update public.localidades
set cota_cero_m = 44.0, cota_cero_provisoria = true, actualizado_en = now()
where id = 'paso-de-la-patria';
