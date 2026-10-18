// Fuente única del parser: la usan la Edge Function (Deno), la API de Vercel y los tests.
/**
 * Lectura de la tabla pública de alturas de Prefectura Naval Argentina.
 * La página es HTML sin API, así que se parsea de forma tolerante:
 * se busca la fila del puerto y se toman la primera altura y la primera fecha.
 */
export const URL_ALTURAS_PREFECTURA = 'https://contenidosweb.prefecturanaval.gob.ar/alturas/';

export interface FilaPrefectura {
  altura_m: number;
  variacion_m: number | null;
  /** ISO 8601 con offset de Argentina (-03:00). */
  fecha: string | null;
}

const limpiar = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

const numero = (s: string): number | null => {
  const m = s.match(/^[+-]?\d{1,2}(?:[.,]\d{1,2})?$/);
  return m ? Number(s.replace(',', '.')) : null;
};

function fechaISO(texto: string): string | null {
  const m = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, a, h = '00', mi = '00'] = m;
  const anio = a.length === 2 ? `20${a}` : a;
  const p = (v: string) => v.padStart(2, '0');
  return `${anio}-${p(mo)}-${p(d)}T${p(h)}:${mi}:00-03:00`;
}

export function parsearAlturaPrefectura(html: string, puerto: string): FilaPrefectura | null {
  const objetivo = normalizar(puerto);
  for (const fila of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const celdas = (fila.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(limpiar);
    const idx = celdas.findIndex((c) => normalizar(c) === objetivo);
    if (idx === -1) continue;

    const resto = celdas.slice(idx + 1);
    const numeros = resto.map(numero);
    const iAltura = numeros.findIndex((n) => n !== null);
    if (iAltura === -1) return null;
    const variacion = numeros.slice(iAltura + 1).find((n) => n !== null) ?? null;
    const fecha = resto.map(fechaISO).find((f) => f !== null) ?? null;
    return { altura_m: numeros[iAltura]!, variacion_m: variacion, fecha };
  }
  return null;
}
