/// <reference lib="webworker" />
// Baja el terreno y calcula los umbrales de inundación fuera del hilo principal.
import { getLocalidad } from '../../shared/localidades';
import { calcularUmbrales } from './inundacion';
import { cargarGrilla, indicesDeSemillas } from './terreno';

export type MensajeModelo =
  | {
      ok: true;
      ancho: number;
      alto: number;
      elev: Float32Array;
      umbral: Float32Array;
      esquinas: [number, number][];
      celda_m: number;
      /** Cota del pelo de agua del río en el DEM (para separar el cauce permanente). */
      cotaCauce: number;
    }
  | { ok: false; error: string };

self.onmessage = async (e: MessageEvent<{ localidad: string }>) => {
  try {
    const loc = getLocalidad(e.data.localidad);
    if (!loc) throw new Error(`Localidad desconocida: ${e.data.localidad}`);
    const g = await cargarGrilla(loc.dem, loc.bbox);
    const semillas = indicesDeSemillas(g, loc.semillasRio, loc.dem.zoomModelo);
    if (semillas.length === 0) throw new Error('Las semillas del río quedan fuera del área de estudio.');
    const umbral = calcularUmbrales(g.elev, g.ancho, g.alto, semillas);
    const cotaCauce = Math.max(...semillas.map((s) => g.elev[s])) + 0.5;
    const msg: MensajeModelo = { ok: true, ...g, umbral, cotaCauce };
    (self as DedicatedWorkerGlobalScope).postMessage(msg, [g.elev.buffer, umbral.buffer]);
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({ ok: false, error: (err as Error).message } satisfies MensajeModelo);
  }
};
