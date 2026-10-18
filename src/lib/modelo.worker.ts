/// <reference lib="webworker" />
// Carga el modelo de inundación fuera del hilo principal. Si la localidad tiene relieve
// procesado (procesamiento/procesar.py) usa ese; si no, lo calcula con los tiles públicos.
import { getLocalidad } from '../../shared/localidades';
import { calcularUmbrales } from './inundacion';
import { cargarGrilla, decodificarTerrarium, indicesDeSemillas, leerTile } from './terreno';

export interface MetaModelo {
  fuenteDem: string;
  procesadoEn: string | null;
  precalculado: boolean;
}

export type MensajeModelo =
  | {
      ok: true;
      ancho: number;
      alto: number;
      elev: Float32Array;
      umbral: Float32Array;
      esquinas: [number, number][];
      celda_m: number;
      /** Agua permanente (río y lagunas): 1 = no se pinta ni se cuenta como inundación. */
      cauce: Uint8Array;
      meta: MetaModelo;
    }
  | { ok: false; error: string };

interface ModeloJson {
  ancho: number;
  alto: number;
  esquinas: [number, number][];
  celda_m: number;
  cotaCauce: number;
  sinDato: number;
  fuenteDem: string;
  procesadoEn: string;
}

const cauceHasta = (elev: Float32Array, cota: number) => Uint8Array.from(elev, (e) => (e <= cota ? 1 : 0));

async function precalculado(id: string, origen: string): Promise<Extract<MensajeModelo, { ok: true }> | null> {
  const base = `${origen}/data/relieve/${id}`;
  const res = await fetch(`${base}/modelo.json`);
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
  const m = (await res.json()) as ModeloJson;
  const [elevImg, umbralImg, cauceImg] = await Promise.all([
    leerTile(`${base}/elev.png`),
    leerTile(`${base}/umbral.png`),
    leerTile(`${base}/cauce.png`).catch(() => null),
  ]);
  const elev = decodificarTerrarium(elevImg);
  const umbral = decodificarTerrarium(umbralImg);
  for (let i = 0; i < umbral.length; i++) if (umbral[i] >= m.sinDato) umbral[i] = Infinity;
  const cauce = cauceImg ? Uint8Array.from({ length: elev.length }, (_, i) => (cauceImg.data[i * 4] > 127 ? 1 : 0)) : cauceHasta(elev, m.cotaCauce);
  return {
    ok: true,
    ancho: m.ancho,
    alto: m.alto,
    elev,
    umbral,
    esquinas: m.esquinas,
    celda_m: m.celda_m,
    cauce,
    meta: { fuenteDem: `${m.fuenteDem} corregido`, procesadoEn: m.procesadoEn, precalculado: true },
  };
}

self.onmessage = async (e: MessageEvent<{ localidad: string; origen: string }>) => {
  const responder = (msg: MensajeModelo, transfer: Transferable[] = []) => (self as DedicatedWorkerGlobalScope).postMessage(msg, transfer);
  try {
    const loc = getLocalidad(e.data.localidad);
    if (!loc) throw new Error(`Localidad desconocida: ${e.data.localidad}`);

    const pre = await precalculado(loc.id, e.data.origen).catch(() => null);
    if (pre) return responder(pre, [pre.elev.buffer, pre.umbral.buffer, pre.cauce.buffer]);

    const g = await cargarGrilla(loc.dem, loc.bbox);
    const semillas = indicesDeSemillas(g, loc.semillasRio, loc.dem.zoomModelo);
    if (semillas.length === 0) throw new Error('Las semillas del río quedan fuera del área de estudio.');
    const umbral = calcularUmbrales(g.elev, g.ancho, g.alto, semillas);
    const cauce = cauceHasta(g.elev, Math.max(...semillas.map((s) => g.elev[s])) + 0.5);
    responder(
      { ok: true, ...g, umbral, cauce, meta: { fuenteDem: loc.dem.nombre, procesadoEn: null, precalculado: false } },
      [g.elev.buffer, umbral.buffer, cauce.buffer],
    );
  } catch (err) {
    responder({ ok: false, error: (err as Error).message });
  }
};
