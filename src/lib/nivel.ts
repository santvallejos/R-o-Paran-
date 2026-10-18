import type { LecturaNivel } from '../../shared/fuentes/nivel';

/** Intenta la API en vivo; si falla, usa el JSON cargado a mano. */
export async function obtenerNivel(localidad: string): Promise<LecturaNivel | null> {
  const intentos = [`/api/nivel?localidad=${localidad}`, `/data/nivel/${localidad}.json`];
  for (const url of intentos) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) continue;
      const data = (await res.json()) as LecturaNivel;
      if ('altura_m' in data) return data;
    } catch {
      // probar la siguiente fuente
    }
  }
  return null;
}
