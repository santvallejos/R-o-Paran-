import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './paso-de-la-patria.json' with { type: 'json' };

// La configuración vive en JSON para que la lean tanto la app como el
// procesamiento en Python (procesamiento/relieve.py).
//
// hidrometro.cotaCero_m es PROVISORIO: estimado comparando el pelo de agua del DEM
// con una altura típica del río. Ver docs/calibracion.md.
export const pasoDeLaPatria = datos as unknown as Localidad;
