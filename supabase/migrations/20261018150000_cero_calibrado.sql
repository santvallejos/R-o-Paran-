-- Cota del cero del hidrómetro de Paso de la Patria: 44,0 → 40,5 m (sigue siendo provisoria).
-- Con 44,0 m el modelo daba agua en ~4.700 de 9.800 edificios a 7,33 m, cuando a esa altura
-- había una sola familia evacuada (Defensa Civil, 17-18/10/2026). Con 40,5 m da ~130 edificios,
-- casi todos sobre la costa e islas. Ver docs/calibracion.md. Reemplazar por el dato oficial.
update public.localidades
set cota_cero_m = 40.5, cota_cero_provisoria = true, actualizado_en = now()
where id = 'paso-de-la-patria';
