/** Utilidades Web Mercator (mismo esquema de tiles que MapLibre). */
const TILE = 256;

export function lonLatAPixel(lon: number, lat: number, z: number): [number, number] {
  const n = TILE * 2 ** z;
  const r = (lat * Math.PI) / 180;
  return [((lon + 180) / 360) * n, ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * n];
}

export function pixelALonLat(x: number, y: number, z: number): [number, number] {
  const n = TILE * 2 ** z;
  const lon = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return [lon, lat];
}

/** Lado de un píxel en metros a una latitud dada. */
export function metrosPorPixel(lat: number, z: number): number {
  return (2 * Math.PI * 6378137 * Math.cos((lat * Math.PI) / 180)) / (TILE * 2 ** z);
}
