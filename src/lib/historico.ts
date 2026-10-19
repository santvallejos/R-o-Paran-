import { URL_MAPA_INA, serieDiariaIna, type SerieHistorica } from '../../shared/fuentes/ina';
import type { Localidad } from '../../shared/localidades';

const DIAS = 30;

/** La API de Vercel (cacheada en la CDN). En `npm run dev` sin vercel no existe y devuelve el index.html. */
async function desdeApi(localidad: Localidad): Promise<SerieHistorica | null> {
  const res = await fetch(`/api/historico?localidad=${localidad.id}`, { headers: { accept: 'application/json' } });
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
  const data = (await res.json()) as SerieHistorica;
  return Array.isArray(data.serie) && data.serie.length > 0 ? data : null;
}

/** El INA directo desde el navegador: la API a5 permite CORS. */
async function desdeIna(localidad: Localidad): Promise<SerieHistorica | null> {
  if (!localidad.ina) return null;
  const serie = await serieDiariaIna(localidad.ina.serieAltura, DIAS, { signal: AbortSignal.timeout(15000) });
  return serie.length > 0 ? { serie, fuente: 'INA — Sistema de Información y Alerta Hidrológico', url: URL_MAPA_INA } : null;
}

/** Altura diaria de los últimos 30 días. Primero la API propia y después el INA; `null` si no hay datos. */
export async function obtenerHistorico(localidad: Localidad): Promise<SerieHistorica | null> {
  if (!localidad.ina) return null;
  for (const intento of [desdeApi, desdeIna]) {
    const serie = await intento(localidad).catch(() => null);
    if (serie) return serie;
  }
  return null;
}
