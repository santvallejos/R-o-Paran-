import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './itati.json' with { type: 'json' };

// Itatí (Corrientes), localidad piloto de la ampliación al NEA. Igual que Paso de la
// Patria, la configuración vive en JSON para que la lean la app y procesamiento/procesar.py.
//
// hidrometro.cotaCero_m (45,66 m) es el cero IGN que publica el INA para la estación Itatí.
//
// PROVISORIOS hasta validar en el terreno y con imágenes:
// - bbox y semillasRio: trazados a ojo sobre el mapa; revisar que el área cubra la ciudad
//   y que las semillas caigan dentro del cauce principal.
// - umbrales (Alerta 6,5 / Evacuación 7,0): los pisa Prefectura vía la Edge Function
//   registrar-nivel cuando publica los oficiales del puerto.
export const itati = datos as unknown as Localidad;
