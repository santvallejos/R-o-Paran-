import { itati } from './itati.js';
import { pasoDeLaPatria } from './paso-de-la-patria.js';
import type { Localidad } from './types.js';

export type { Localidad, LonLat, Umbral, FuenteOficial } from './types.js';

/**
 * Registro de localidades disponibles. Agregar acá las nuevas.
 * Es estático a propósito: la API de Vercel corre como ESM de Node sin empaquetar,
 * así que no hay glob de archivos; cada localidad se importa con su `.js`.
 */
export const localidades: Record<string, Localidad> = {
  [pasoDeLaPatria.id]: pasoDeLaPatria,
  [itati.id]: itati,
};

export const localidadPorDefecto = pasoDeLaPatria.id;

export function getLocalidad(id: string | null | undefined): Localidad | undefined {
  return localidades[id ?? localidadPorDefecto];
}

/** Todas las localidades registradas, ordenadas por nombre (con acentos, en castellano). */
export function listarLocalidades(): Localidad[] {
  return Object.values(localidades).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
