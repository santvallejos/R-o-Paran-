import { pasoDeLaPatria } from './paso-de-la-patria';
import type { Localidad } from './types';

export type { Localidad, LonLat, Umbral, FuenteOficial } from './types';

/** Registro de localidades disponibles. Agregar acá las nuevas. */
export const localidades: Record<string, Localidad> = {
  [pasoDeLaPatria.id]: pasoDeLaPatria,
};

export const localidadPorDefecto = pasoDeLaPatria.id;

export function getLocalidad(id: string | null | undefined): Localidad | undefined {
  return localidades[id ?? localidadPorDefecto];
}
