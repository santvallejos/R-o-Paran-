import type { Modelo } from './modelo';

export const COLORES = {
  inundada: [37, 99, 235],
  seSuma: [239, 68, 68],
  seLibera: [34, 197, 94],
} as const;

/**
 * Pinta la capa de agua para la cota simulada. Si hay cota actual, distingue
 * lo que se suma (rojo) y lo que se libera (verde) respecto de hoy.
 * El agua permanente (río y lagunas) queda transparente: ya se ve en el mapa base.
 */
export function pintarCapa(m: Modelo, cotaSim: number, cotaActual: number | null, destino?: ImageData): ImageData {
  const img = destino ?? new ImageData(m.ancho, m.alto);
  const px = img.data;
  const { umbral, elev, cauce } = m;
  for (let i = 0; i < umbral.length; i++) {
    const o = i * 4;
    const u = umbral[i];
    const sim = u <= cotaSim;
    const hoy = cotaActual !== null && u <= cotaActual;
    if (cauce[i] || (!sim && !hoy)) {
      px[o + 3] = 0;
      continue;
    }
    let c: readonly number[];
    let a: number;
    if (sim && (hoy || cotaActual === null)) {
      c = COLORES.inundada;
      // Más profundo, más opaco.
      const prof = cotaSim - elev[i];
      a = 110 + Math.min(120, prof * 60);
    } else if (sim) {
      c = COLORES.seSuma;
      a = 200;
    } else {
      c = COLORES.seLibera;
      a = 170;
    }
    px[o] = c[0];
    px[o + 1] = c[1];
    px[o + 2] = c[2];
    px[o + 3] = a;
  }
  return img;
}
