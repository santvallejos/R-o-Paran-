import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './ituzaingo.json' with { type: 'json' };

// Ituzaingó (Corrientes), unos 12 km aguas abajo de la represa de Yacyretá. Datos y fuentes de
// cada valor (consultados el 21/10/2026) en la ficha de docs/localidades-nea.md.
//
// hidrometro.cotaCero_m (58,3 m, provisorio): el INA no publica el cero IGN de la estación 15.
// Se extrapoló aguas arriba desde Itá Ibaté (cero IGN 52,42) con la pendiente Itá Ibaté–Itatí
// (cero IGN 45,66): con el río alto (2013–2026, 4–5 m en Ituzaingó) da 58,2–58,6 m, y el pelo de
// agua del SRTM del 12/02/2000 (60,0 m con 1,63 m en la escala) da 58,4 m. Con el río bajo la
// extrapolación da ~57,0 m: la pendiente aguas abajo de la presa no es uniforme. Incertidumbre
// de ±1 m. La EBY no publica el nivel aguas abajo de la presa en msnm.
//
// - bbox y semillasRio: calles y límite internacional de OSM y el DEM. El casco está sobre una
//   barranca de 70–80 m; lo inundable es la franja costera (playas, muelle de Prefectura) y las
//   islas argentinas de enfrente. Las semillas caen en el canal de restitución, del lado
//   argentino del límite, en agua plana a 60,0 m. El embalse (75–83 m) y la presa quedan fuera.
// - umbrales (Alerta 3,5 / Evacuación 4,0): los de Prefectura (coinciden con INA y EBY); la Edge
//   Function registrar-nivel los mantiene al día. La EBY figura en `fuentes` sólo como enlace a
//   sus alertas oficiales: la app no muestra datos suyos.
// - crecidasHistoricas: máximos de la serie 15 del INA, sin datos aislados erróneos. Los picos
//   de 1983 y 1992 son anteriores al cierre de Yacyretá (1994): para una misma altura en Itá Ibaté,
//   hoy la escala marca ~0,5 m menos que en 1970–1994 (el motivo es FALTANTE).
export const ituzaingo = datos as unknown as Localidad;
