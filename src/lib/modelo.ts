import type { MensajeModelo } from './modelo.worker';

export type Modelo = Extract<MensajeModelo, { ok: true }>;

export function cargarModelo(localidad: string): Promise<Modelo> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./modelo.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<MensajeModelo>) => {
      w.terminate();
      if (e.data.ok) resolve(e.data);
      else reject(new Error(e.data.error));
    };
    w.onerror = (e) => {
      w.terminate();
      reject(new Error(e.message || 'Error en el cálculo del modelo'));
    };
    w.postMessage({ localidad, origen: location.origin });
  });
}
