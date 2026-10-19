// Datos de la escena 3D generados por procesamiento/relieve/escena3d.py.
import { urlRelieve } from '../lib/relieve';

export interface Arboles {
  /** x, z en metros locales (desde la esquina noroeste de la grilla del modelo) y escala. */
  x: Float32Array;
  z: Float32Array;
  escala: Float32Array;
}

export interface Edificio {
  /** Cota absoluta (m) a la que el agua alcanza el edificio; null si no se conecta con el río. */
  cotaAgua: number | null;
  altura_m: number;
  base_m: number;
  /** Polígono en metros locales: [x0, z0, x1, z1, …]. */
  contorno: Float32Array;
}

export interface DatosEscena {
  cobertura: Uint8Array;
  arboles: Arboles;
  edificios: Edificio[];
}

export function decodificarArboles(buf: ArrayBuffer, unidad = 0.25): Arboles {
  const u = new Uint16Array(buf);
  const n = Math.floor(u.length / 3);
  const a = { x: new Float32Array(n), z: new Float32Array(n), escala: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    a.x[i] = u[i * 3] * unidad;
    a.z[i] = u[i * 3 + 1] * unidad;
    a.escala[i] = u[i * 3 + 2] / 100;
  }
  return a;
}

export function decodificarEdificios(json: { unidad_m: number; e: (number | null)[][] }): Edificio[] {
  return json.e.map(([cota, alturaDm, baseCm, ...pts]) => ({
    cotaAgua: cota === null ? null : (cota as number) / 100,
    altura_m: (alturaDm as number) / 10,
    base_m: (baseCm as number) / 100,
    contorno: Float32Array.from(pts as number[], (v) => v * json.unidad_m),
  }));
}

async function cobertura(url: string, n: number): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) return new Uint8Array(n);
  const bmp = await createImageBitmap(await res.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height);
  return Uint8Array.from({ length: n }, (_, i) => data[i * 4]);
}

export async function cargarDatosEscena(localidad: string, celdas: number): Promise<DatosEscena> {
  // Misma carpeta que el modelo: bucket de Supabase Storage o /data/relieve (ver lib/relieve.ts).
  const base = `${urlRelieve(localidad)}/escena`;
  const [cob, arb, edif] = await Promise.all([
    cobertura(`${base}/cobertura.png`, celdas),
    fetch(`${base}/arboles.bin`).then((r) => (r.ok ? r.arrayBuffer() : new ArrayBuffer(0))),
    fetch(`${base}/edificios.json`).then((r) => (r.ok ? r.json() : { unidad_m: 0.25, e: [] })),
  ]);
  return { cobertura: cob, arboles: decodificarArboles(arb), edificios: decodificarEdificios(edif) };
}
