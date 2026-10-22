import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './corrientes.json' with { type: 'json' };

// Corrientes (capital). Datos y fuentes de cada valor (consultados el 22/10/2026) en la ficha de
// docs/localidades-nea.md.
//
// hidrometro.cotaCero_m (42,39 m) es el cero IGN que publica el INA para la estación Corrientes
// (serie 19). El INA no declara el sistema de alturas; el 12/02/2000 (pasada del SRTM) la escala
// marcaba 2,95 m (agua a 45,34 m) y el DEM frente al puerto da 45,0 m: ~0,3 m de diferencia.
//
// - bbox y semillasRio: barrios del visor IDEMCC de la Municipalidad, calles de OSM y el DEM. El
//   casco está sobre una barranca de 60–66 m; lo inundable es la franja costera (Punta Taitalo,
//   Molina Punta, Perichón, Arazaty, barrio Río Paraná), los bajos del norte (Anahí, Sol de Mayo,
//   Quinta Ferré) y el valle del Riachuelo al sur. Deja afuera Barranqueras y Resistencia, que
//   están detrás de defensas que el modelo no tiene. Las semillas caen en el cauce frente al
//   puerto (45,0 m), aguas abajo (44,0 m) y frente a Punta Taitalo (45,0 m).
// - umbrales (Alerta 6,5 / Evacuación 7,0): los de Prefectura e INA; la Edge Function
//   registrar-nivel los mantiene al día.
// - crecidasHistoricas: máximos de la serie 19 del INA (datos desde 1901).
export const corrientes = datos as unknown as Localidad;
