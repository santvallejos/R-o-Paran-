import type { Localidad } from './types.js';
// En JSON para que `validar.ts` lo importe también desde `scripts/` (Node sin empaquetar, imports `.ts`).
import datos from './regiones.json' with { type: 'json' };

/** Tramo del río que agrupa localidades en el selector y en el mapa regional. */
export interface Region {
  /** Lo que va en `Localidad.region` y en `?region=<id>`. */
  id: string;
  nombre: string;
}

/**
 * Regiones disponibles (`regiones.json`), en el orden en que se muestran: aguas abajo, de norte a sur.
 * Para sumar una, agregarla en el JSON en su lugar del recorrido del río.
 */
export const regiones: Region[] = datos;

export function getRegion(id: string | null | undefined): Region | undefined {
  return regiones.find((r) => r.id === id);
}

export interface GrupoRegion {
  region: Region;
  /** Provincias de sus localidades, sin repetir y ordenadas. */
  provincias: string[];
  /** Ordenadas por nombre. */
  localidades: Localidad[];
}

/** Agrupa por región en el orden de `regiones`; las regiones sin localidades no aparecen. */
export function agruparPorRegion(locs: Localidad[]): GrupoRegion[] {
  const porNombre = (a: string, b: string) => a.localeCompare(b, 'es');
  return regiones
    .map((region) => {
      const lista = locs.filter((l) => l.region === region.id).sort((a, b) => porNombre(a.nombre, b.nombre));
      return { region, provincias: [...new Set(lista.map((l) => l.provincia))].sort(porNombre), localidades: lista };
    })
    .filter((g) => g.localidades.length > 0);
}
