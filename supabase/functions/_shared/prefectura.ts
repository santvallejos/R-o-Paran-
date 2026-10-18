// Fuente única del parser: la usan la Edge Function (Deno), la API de Vercel y los tests.
/**
 * Lectura de la tabla pública de alturas de Prefectura Naval Argentina.
 * La página es HTML sin API. Cada fila, después del nombre del puerto, trae:
 *   río | altura | variación | período (h) | fecha "18/OCT/26 - 1400" | estado |
 *   … | altura anterior | fecha anterior | alerta | evacuación | …
 * Se parsea de forma tolerante: por tipo de celda y orden, no por posición fija.
 */
export const URL_ALTURAS_PREFECTURA = 'https://contenidosweb.prefecturanaval.gob.ar/alturas/';

export interface FilaPrefectura {
  altura_m: number;
  variacion_m: number | null;
  /** ISO 8601 con offset de Argentina (-03:00). */
  fecha: string | null;
  /** Texto tal como lo publica Prefectura, p. ej. "EVACUACION CRECE". */
  estado: string | null;
  alerta_m: number | null;
  evacuacion_m: number | null;
}

const MESES: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', SET: '09', OCT: '10', NOV: '11', DIC: '12',
};

const limpiar = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

const numero = (s: string): number | null => {
  const m = s.match(/^[+-]?\d{1,2}(?:[.,]\d{1,2})?$/);
  return m ? Number(s.replace(',', '.')) : null;
};

/** Acepta "18/OCT/26 - 1400", "18/10/2026 14:00" y variantes. */
export function fechaISO(texto: string): string | null {
  const m = normalizar(texto).match(/^(\d{1,2})\/(\d{1,2}|[A-Z]{3})\/(\d{2,4})(?:\s*-?\s*(\d{1,2}):?(\d{2}))?$/);
  if (!m) return null;
  const [, d, mesTxt, a, h = '00', mi = '00'] = m;
  const mes = /^\d+$/.test(mesTxt) ? mesTxt.padStart(2, '0') : MESES[mesTxt];
  if (!mes) return null;
  const anio = a.length === 2 ? `20${a}` : a;
  return `${anio}-${mes}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${mi}:00-03:00`;
}

/** Celdas (texto) de la fila del puerto, desde la siguiente al nombre. Útil para diagnosticar. */
export function celdasDelPuerto(html: string, puerto: string): string[] | null {
  const objetivo = normalizar(puerto);
  for (const fila of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const celdas = (fila.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(limpiar);
    const idx = celdas.findIndex((c) => normalizar(c) === objetivo);
    if (idx !== -1) return celdas.slice(idx + 1);
  }
  return null;
}

export function parsearAlturaPrefectura(html: string, puerto: string): FilaPrefectura | null {
  const resto = celdasDelPuerto(html, puerto);
  if (!resto) return null;
  const numeros = resto.map(numero);
  const fechas = resto.map(fechaISO);

  const iAltura = numeros.findIndex((n) => n !== null);
  if (iAltura === -1) return null;
  const iFecha = fechas.findIndex((f, i) => f !== null && i > iAltura);
  const antesDeFecha = iFecha === -1 ? numeros.slice(iAltura + 1) : numeros.slice(iAltura + 1, iFecha);
  const variacion = antesDeFecha.find((n) => n !== null) ?? null;

  let estado: string | null = null;
  let alerta: number | null = null;
  let evacuacion: number | null = null;
  if (iFecha !== -1) {
    estado = resto.slice(iFecha + 1).find((c) => c && numero(c) === null && fechaISO(c) === null) ?? null;
    // Umbrales: los dos números que siguen a la fecha de la lectura anterior.
    const iFechaAnterior = fechas.findIndex((f, i) => f !== null && i > iFecha);
    if (iFechaAnterior !== -1) {
      const siguientes = numeros.slice(iFechaAnterior + 1).filter((n): n is number => n !== null);
      [alerta = null, evacuacion = null] = siguientes;
    }
  }

  return {
    altura_m: numeros[iAltura]!,
    variacion_m: variacion,
    fecha: iFecha === -1 ? null : fechas[iFecha],
    estado,
    alerta_m: alerta,
    evacuacion_m: evacuacion,
  };
}
