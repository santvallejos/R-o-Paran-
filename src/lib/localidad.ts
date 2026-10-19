import type { Localidad, Umbral } from '../../shared/localidades';
import { resolverTiles, urlRelieve } from './relieve';
import { consultar, supabaseConfigurado } from './supabase';

interface FilaLocalidad {
  cota_cero_m: number;
  cota_cero_provisoria: boolean;
  umbrales: Umbral[];
  pronostico: Localidad['pronostico'] | null;
}

/**
 * Los valores operativos (cota del cero, umbrales, pronóstico) se pueden actualizar en
 * Supabase sin redeploy. Si no hay conexión, quedan los del repo.
 */
export async function conDatosOperativos(loc: Localidad): Promise<Localidad> {
  if (!supabaseConfigurado) return loc;
  try {
    const [f] = await consultar<FilaLocalidad[]>(
      `localidades?id=eq.${encodeURIComponent(loc.id)}&select=cota_cero_m,cota_cero_provisoria,umbrales,pronostico&limit=1`,
    );
    if (!f) return loc;
    return {
      ...loc,
      hidrometro: { ...loc.hidrometro, cotaCero_m: Number(f.cota_cero_m), cotaCeroProvisoria: f.cota_cero_provisoria },
      umbrales: f.umbrales?.length ? f.umbrales : loc.umbrales,
      pronostico: f.pronostico ?? undefined,
    };
  } catch {
    return loc;
  }
}

export interface TerrenoProcesado {
  tiles: string;
  minzoom: number;
  maxzoom: number;
  bounds: [number, number, number, number];
  encoding: 'terrarium' | 'mapbox';
  fuente: string;
}

/** Tiles de relieve generados por procesamiento/procesar.py, si existen. */
export async function terrenoProcesado(id: string): Promise<TerrenoProcesado | null> {
  try {
    // Carpeta de la localidad: bucket de Supabase Storage o /data/relieve (ver lib/relieve.ts).
    const base = urlRelieve(id);
    const res = await fetch(`${base}/terreno.json`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    const t = (await res.json()) as TerrenoProcesado;
    // MapLibre baja los tiles desde un worker: necesita la URL absoluta, resuelta contra la misma base.
    return { ...t, tiles: resolverTiles(t.tiles, id, base) };
  } catch {
    return null;
  }
}
