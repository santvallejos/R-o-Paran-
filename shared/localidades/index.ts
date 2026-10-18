import { pasoDeLaPatria } from './paso-de-la-patria.js';
import type { Localidad } from './types.js';

export type { Localidad, LonLat, Umbral, FuenteOficial } from './types.js';

/** Registro de localidades disponibles. Agregar acá las nuevas. */
export const localidades: Record<string, Localidad> = {
  [pasoDeLaPatria.id]: pasoDeLaPatria,
};

export const localidadPorDefecto = pasoDeLaPatria.id;

export function getLocalidad(id: string | null | undefined): Localidad | undefined {
  return localidades[id ?? localidadPorDefecto];
}
