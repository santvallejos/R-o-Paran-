import { lonLatAPixel, metrosPorPixel, pixelALonLat } from './geo';
import type { Localidad, LonLat } from '../../shared/localidades';

export interface GrillaTerreno {
  ancho: number;
  alto: number;
  /** Elevación en metros, fila por fila desde el norte. */
  elev: Float32Array;
  /** Esquinas de la grilla: NO, NE, SE, SO (formato de ImageSource de MapLibre). */
  esquinas: [LonLat, LonLat, LonLat, LonLat];
  /** Lado de celda en metros (aprox., en el centro). */
  celda_m: number;
}

type Decodificador = (r: number, g: number, b: number) => number;
const decodificadores: Record<Localidad['dem']['encoding'], Decodificador> = {
  terrarium: (r, g, b) => r * 256 + g + b / 256 - 32768,
  mapbox: (r, g, b) => -10000 + (r * 65536 + g * 256 + b) * 0.1,
};

export async function leerTile(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo bajar el terreno (${res.status}): ${url}`);
  // Sin conversión de color ni premultiplicado: los píxeles son datos, no una imagen.
  const bmp = await createImageBitmap(await res.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  return ctx.getImageData(0, 0, bmp.width, bmp.height);
}

/** Decodifica una imagen Terrarium completa a elevaciones. */
export function decodificarTerrarium({ data }: ImageData): Float32Array {
  const out = new Float32Array(data.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = decodificadores.terrarium(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  return out;
}

/** Baja los tiles de terreno que cubren el bbox y arma una grilla recortada. */
export async function cargarGrilla(dem: Localidad['dem'], bbox: Localidad['bbox']): Promise<GrillaTerreno> {
  const z = dem.zoomModelo;
  const [oeste, sur, este, norte] = bbox;
  const [x0, y0] = lonLatAPixel(oeste, norte, z).map(Math.floor);
  const [x1, y1] = lonLatAPixel(este, sur, z).map(Math.ceil);
  const ancho = x1 - x0;
  const alto = y1 - y0;
  const elev = new Float32Array(ancho * alto);
  const decodificar = decodificadores[dem.encoding];

  const pedidos: Promise<void>[] = [];
  for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y1 - 1) / 256); ty++) {
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x1 - 1) / 256); tx++) {
      const url = dem.tiles.replace('{z}', String(z)).replace('{x}', String(tx)).replace('{y}', String(ty));
      pedidos.push(
        leerTile(url).then(({ data, width }) => {
          for (let py = 0; py < 256; py++) {
            const gy = ty * 256 + py - y0;
            if (gy < 0 || gy >= alto) continue;
            for (let px = 0; px < 256; px++) {
              const gx = tx * 256 + px - x0;
              if (gx < 0 || gx >= ancho) continue;
              const i = (py * width + px) * 4;
              elev[gy * ancho + gx] = decodificar(data[i], data[i + 1], data[i + 2]);
            }
          }
        }),
      );
    }
  }
  await Promise.all(pedidos);

  const no = pixelALonLat(x0, y0, z);
  const se = pixelALonLat(x1, y1, z);
  return {
    ancho,
    alto,
    elev,
    esquinas: [no, [se[0], no[1]], se, [no[0], se[1]]],
    celda_m: metrosPorPixel((no[1] + se[1]) / 2, z),
  };
}

/** Convierte puntos lon/lat a índices de celda dentro de la grilla. */
export function indicesDeSemillas(grilla: GrillaTerreno, semillas: LonLat[], z: number): number[] {
  const [x0, y0] = lonLatAPixel(...grilla.esquinas[0], z);
  return semillas
    .map(([lon, lat]) => {
      const [x, y] = lonLatAPixel(lon, lat, z);
      const c = Math.floor(x - x0);
      const f = Math.floor(y - y0);
      return c >= 0 && c < grilla.ancho && f >= 0 && f < grilla.alto ? f * grilla.ancho + c : -1;
    })
    .filter((i) => i >= 0);
}
