import type { LecturaNivel } from '../../shared/fuentes/nivel';
import { consultar, supabaseConfigurado } from './supabase';

interface FilaLectura {
  localidad_id: string;
  altura_m: number;
  variacion_m: number | null;
  medido_en: string;
  fuente: string;
  url: string | null;
  modo: 'automatico' | 'manual';
}

/** Última lectura guardada en Supabase (la registra la Edge Function o se carga a mano). */
async function desdeSupabase(localidad: string): Promise<LecturaNivel | null> {
  if (!supabaseConfigurado) return null;
  const [f] = await consultar<FilaLectura[]>(`ultima_lectura?localidad_id=eq.${encodeURIComponent(localidad)}&limit=1`);
  if (!f) return null;
  return {
    localidad: f.localidad_id,
    altura_m: Number(f.altura_m),
    variacion_m: f.variacion_m === null ? null : Number(f.variacion_m),
    fecha: f.medido_en,
    fuente: f.fuente,
    url: f.url ?? undefined,
    modo: f.modo,
  };
}

async function desdeUrl(url: string): Promise<LecturaNivel | null> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
  const data = (await res.json()) as LecturaNivel;
  return 'altura_m' in data && data.altura_m !== null ? data : null;
}

/**
 * Fuentes en orden: Supabase (historial), la API en vivo y el JSON manual del repo.
 * Devuelve la primera con dato; si ninguna tiene, una lectura vacía para mostrar el aviso.
 */
export async function obtenerNivel(localidad: string): Promise<LecturaNivel | null> {
  const intentos = [
    () => desdeSupabase(localidad),
    () => desdeUrl(`/api/nivel?localidad=${localidad}`),
    () => desdeUrl(`/data/nivel/${localidad}.json`),
  ];
  for (const intento of intentos) {
    const lectura = await intento().catch(() => null);
    if (lectura) return lectura;
  }
  return null;
}
