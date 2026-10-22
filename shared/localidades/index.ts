import { campana } from './campana.js';
import { corrientes } from './corrientes.js';
import { itati } from './itati.js';
import { ituzaingo } from './ituzaingo.js';
import { pasoDeLaPatria } from './paso-de-la-patria.js';
import { zarate } from './zarate.js';
import type { Localidad } from './types.js';

export type { Localidad, LonLat, Umbral, FuenteOficial } from './types.js';
export { agruparPorRegion, getRegion, regiones, type GrupoRegion, type Region } from './regiones.js';

/**
 * Registro de localidades disponibles. Agregar acá las nuevas.
 * Es estático a propósito: la API de Vercel corre como ESM de Node sin empaquetar,
 * así que no hay glob de archivos; cada localidad se importa con su `.js`.
 */
export const localidades: Record<string, Localidad> = {
  [pasoDeLaPatria.id]: pasoDeLaPatria,
  [itati.id]: itati,
  [ituzaingo.id]: ituzaingo,
  [corrientes.id]: corrientes,
  [campana.id]: campana,
  [zarate.id]: zarate,
};

export const localidadPorDefecto = pasoDeLaPatria.id;

export function getLocalidad(id: string | null | undefined): Localidad | undefined {
  return localidades[id ?? localidadPorDefecto];
}

/** Todas las localidades registradas, ordenadas por nombre (con acentos, en castellano). */
export function listarLocalidades(): Localidad[] {
  return Object.values(localidades).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
