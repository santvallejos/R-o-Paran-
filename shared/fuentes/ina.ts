// API pública a5 del INA (Sistema de Información y Alerta Hidrológico). No pide token
// y permite CORS, así que la usan tanto la API de Vercel como el navegador de respaldo.

export const URL_API_INA = 'https://alerta.ina.gob.ar/a5';
export const URL_MAPA_INA = 'https://alerta.ina.gob.ar/pub/mapa';

/** Observación puntual tal como la devuelve `/obs/puntual/observaciones` (sólo los campos que usamos). */
export interface ObservacionIna {
  series_id?: number;
  timestart: string;
  timeend?: string;
  valor: number | string | null;
}

/** Altura máxima de un día (hora argentina). */
export interface DatoDiario {
  fecha: string;
  altura_m: number;
}

/** Respuesta de `GET /api/historico`. */
export interface SerieHistorica {
  serie: DatoDiario[];
  fuente: string;
  url: string;
}

/** Argentina no usa horario de verano: UTC−3 todo el año. */
const OFFSET_AR_MS = -3 * 3600 * 1000;

/** YYYY-MM-DD de una fecha, en UTC (la API filtra por día calendario). */
const dia = (d: Date) => d.toISOString().slice(0, 10);

export function urlObservacionesIna(serieId: number, desde: Date, hasta: Date): string {
  const q = new URLSearchParams({ series_id: String(serieId), timestart: dia(desde), timeend: dia(hasta), format: 'json' });
  return `${URL_API_INA}/obs/puntual/observaciones?${q}`;
}

/**
 * Agrupa las observaciones por día en hora argentina y se queda con el máximo de cada uno.
 * Descarta los valores ≤ 0 o no numéricos: el INA carga 0 cuando falta el dato.
 */
export function agregarDiario(obs: ObservacionIna[]): DatoDiario[] {
  const maximos = new Map<string, number>();
  for (const o of obs) {
    const valor = Number(o.valor);
    const t = Date.parse(o.timestart);
    if (o.valor === null || !Number.isFinite(valor) || valor <= 0 || Number.isNaN(t)) continue;
    // Corre el instante a UTC−3 y toma la fecha: así 02:00 UTC cae en el día anterior.
    const fecha = dia(new Date(t + OFFSET_AR_MS));
    const previo = maximos.get(fecha);
    if (previo === undefined || valor > previo) maximos.set(fecha, valor);
  }
  return [...maximos]
    .map(([fecha, altura_m]) => ({ fecha, altura_m }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Pide las observaciones de una serie y las resume por día. Lanza si el INA falla. */
export async function serieDiariaIna(serieId: number, dias: number, init?: RequestInit): Promise<DatoDiario[]> {
  const ahora = Date.now();
  const desde = new Date(ahora - dias * 86400 * 1000);
  // `timeend` sin hora se toma como medianoche: se pide hasta mañana para no perder lo de hoy.
  const hasta = new Date(ahora + 86400 * 1000);
  const res = await fetch(urlObservacionesIna(serieId, desde, hasta), init);
  if (!res.ok) throw new Error(`INA respondió ${res.status}`);
  // Responde con content-type text/plain aunque el cuerpo sea JSON.
  const datos: unknown = JSON.parse(await res.text());
  if (!Array.isArray(datos)) throw new Error('Respuesta inesperada del INA');
  return agregarDiario(datos as ObservacionIna[]);
}
