import type * as maplibregl from 'maplibre-gl';
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

export type Base = 'satelite' | 'calles';

/**
 * Estilo vectorial de calles de OpenFreeMap (Positron). Es gratis y sin límite de uso, a
 * diferencia de tile.openstreetmap.org, cuyas reglas no permiten apps con mucho tráfico.
 */
const ESTILO_CALLES = 'https://tiles.openfreemap.org/styles/positron';
/** Prefijo de las capas y fuentes de calles, para no chocar con las del mapa. */
const PREFIJO = 'calles-';

/** Fuente raster del satélite; la comparten el mapa de la localidad y el regional. */
export const FUENTES_BASE = {
  satelite: {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    maxzoom: 19,
    attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
  },
} satisfies StyleSpecification['sources'];

/** Capa del satélite. Las de calles se agregan después con `agregarCalles`. */
export const CAPAS_BASE = [{ id: 'satelite', type: 'raster', source: 'satelite' }] satisfies StyleSpecification['layers'];

// El estilo de calles se baja una sola vez por sesión, aunque se abran varios mapas.
let estiloCalles: Promise<StyleSpecification> | null = null;

/**
 * Agrega las capas de calles de OpenFreeMap debajo de `antesDe` (o arriba de todo), visibles
 * sólo si `visible`. Devuelve sus ids para alternar la base, o [] si el estilo no se pudo bajar:
 * en ese caso el mapa sigue con el satélite.
 */
export async function agregarCalles(m: maplibregl.Map, visible: boolean, antesDe?: string): Promise<string[]> {
  estiloCalles ??= fetch(ESTILO_CALLES).then((r) => {
    if (!r.ok) throw new Error(`Estilo de calles: HTTP ${r.status}`);
    return r.json() as Promise<StyleSpecification>;
  });
  let s: StyleSpecification;
  try {
    s = await estiloCalles;
  } catch {
    estiloCalles = null; // se reintenta en el próximo mapa
    return [];
  }
  // El mapa pudo haberse desmontado mientras se bajaba el estilo.
  if (!m.getStyle()) return [];

  // Tipografías e íconos de las etiquetas (el estilo propio no los declara).
  if (s.glyphs) m.setGlyphs(s.glyphs);
  if (typeof s.sprite === 'string') m.setSprite(s.sprite);

  // Fuentes con prefijo, sólo las que usan las capas.
  const usadas = new Set(s.layers.flatMap((l) => ('source' in l && typeof l.source === 'string' ? [l.source] : [])));
  for (const [id, fuente] of Object.entries(s.sources)) {
    if (usadas.has(id) && !m.getSource(PREFIJO + id)) m.addSource(PREFIJO + id, fuente);
  }

  // Capas con prefijo y la visibilidad pedida; `antesDe` las deja debajo del sombreado y el agua.
  const ids: string[] = [];
  const debajo = antesDe && m.getLayer(antesDe) ? antesDe : undefined;
  for (const capa of s.layers) {
    const id = PREFIJO + capa.id;
    if (m.getLayer(id)) continue;
    const nueva = {
      ...capa,
      id,
      ...('source' in capa && typeof capa.source === 'string' && { source: PREFIJO + capa.source }),
      layout: { ...capa.layout, visibility: visible ? 'visible' : 'none' },
    } as LayerSpecification;
    m.addLayer(nueva, debajo);
    ids.push(id);
  }
  return ids;
}

/**
 * Muestra la base elegida: el satélite o las capas de calles. Si las calles todavía no
 * están (o no se pudieron bajar), queda el satélite para no dejar el mapa vacío.
 */
export function aplicarBase(m: maplibregl.Map, base: Base, idsCalles: string[]): void {
  const calles = base === 'calles' && idsCalles.length > 0;
  m.setLayoutProperty('satelite', 'visibility', calles ? 'none' : 'visible');
  for (const id of idsCalles) m.setLayoutProperty(id, 'visibility', calles ? 'visible' : 'none');
}
