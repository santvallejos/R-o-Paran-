import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './itati.json' with { type: 'json' };

// Itatí (Corrientes), localidad piloto de la ampliación al NEA. Igual que Paso de la
// Patria, la configuración vive en JSON para que la lean la app y procesamiento/procesar.py.
//
// hidrometro.cotaCero_m (45,66 m) es el cero IGN que publica el INA para la estación Itatí
// (serie 17). El INA no declara el sistema de alturas; contra el DEM el agua queda ~0,8 m
// más alta. Datos y fuentes de cada valor en docs/localidades-nea.md.
//
// - bbox y semillasRio: armados con calles de OSM y el DEM (las semillas caen en el cauce,
//   a 48,0 m). El pueblo está sobre la barranca; lo inundable es la costa y el barrio Ibiray.
// - umbrales (Alerta 6,8 / Evacuación 7,5): los de Prefectura e INA; la Edge Function
//   registrar-nivel los mantiene al día.
// - crecidasHistoricas: máximos de la serie 17 del INA (el pico de 1983 fue en julio).
export const itati = datos as unknown as Localidad;
