import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../api/estado';

// Misma forma que la tabla real de Prefectura (ver shared/fuentes/prefectura.test.ts). Vive fuera de api/ porque Vercel publica como función todo lo que hay ahí.
const celdas = (puerto: string, resto: string[]) => `<tr><td>${puerto}</td>${resto.map((c) => `<td>${c}</td>`).join('')}</tr>`;
const html = `<table>
  ${celdas('ITATI', ['PARANA', '8.17', '0.02', '2', '18/OCT/26 - 2200', 'EVACUACION CRECE', '', '8.15', '18/OCT/26 - 2000', '6.80', '7.50', ''])}
  ${celdas('PASO DE LA PATRIA', ['PARANA', '7.41', '0.02', '2', '18/OCT/26 - 2200', 'EVACUACION CRECE', '', '7.39', '18/OCT/26 - 2000', '6.50', '7.00', ''])}
</table>`;

afterEach(() => vi.unstubAllGlobals());

describe('GET /api/estado', () => {
  it('devuelve todas las localidades con una sola descarga y caché de CDN', async () => {
    const fetchFalso = vi.fn(async () => new Response(html, { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    const res = await GET();
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(res.headers.get('cache-control')).toContain('s-maxage=1800');
    expect(await res.json()).toEqual({
      itati: { altura_m: 8.17, fecha: '2026-10-18T22:00:00-03:00', alerta_m: 6.8, evacuacion_m: 7.5 },
      'paso-de-la-patria': { altura_m: 7.41, fecha: '2026-10-18T22:00:00-03:00', alerta_m: 6.5, evacuacion_m: 7.0 },
    });
  });

  it('responde 502 con caché corta si Prefectura falla', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 503 })));
    const res = await GET();
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('s-maxage=300');
  });
});
