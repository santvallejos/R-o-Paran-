import type { Modelo } from './modelo';

export const COLORES = {
  inundada: [37, 99, 235],
  seSuma: [239, 68, 68],
  seLibera: [34, 197, 94],
  cauce: [125, 211, 252],
} as const;

/** Opacidad del agua permanente: se ve el río debajo, pero queda claro que es agua. */
const ALFA_CAUCE = 80;

/**
 * Pinta la capa de agua para la cota simulada. Si hay cota actual, distingue
 * lo que se suma (rojo) y lo que se libera (verde) respecto de hoy.
 * El agua permanente (máscara de Copernicus 2011–2015) se pinta siempre en celeste
 * con alfa bajo: en la imagen satelital esas celdas pueden verse como bancos de arena
 * o playas secas y, sin pintar, parecería que la arena baja no se inunda.
 * Los píxeles transparentes llevan el RGB del azul de inundación con alfa 0, para que
 * el remuestreo lineal del mapa no genere halos oscuros en los bordes.
 * El buffer `destino` se reutiliza entre cuadros: se escriben los 4 canales de cada píxel.
 */
export function pintarCapa(m: Modelo, cotaSim: number, cotaActual: number | null, destino?: ImageData): ImageData {
  const img = destino ?? new ImageData(m.ancho, m.alto);
  const px = img.data;
  const { umbral, elev, cauce } = m;
  const [tr, tg, tb] = COLORES.inundada;
  for (let i = 0; i < umbral.length; i++) {
    const o = i * 4;
    let c: readonly number[];
    let a: number;
    if (cauce[i]) {
      // Agua permanente: celeste tenue, independiente de la cota.
      c = COLORES.cauce;
      a = ALFA_CAUCE;
    } else {
      const u = umbral[i];
      const sim = u <= cotaSim;
      const hoy = cotaActual !== null && u <= cotaActual;
      if (!sim && !hoy) {
        // Seco: transparente, pero con el RGB del azul para que la interpolación no oscurezca.
        px[o] = tr;
        px[o + 1] = tg;
        px[o + 2] = tb;
        px[o + 3] = 0;
        continue;
      }
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
    }
    px[o] = c[0];
    px[o + 1] = c[1];
    px[o + 2] = c[2];
    px[o + 3] = a;
  }
  return img;
}
