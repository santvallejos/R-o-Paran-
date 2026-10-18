import { describe, expect, it } from 'vitest';
import { fechaISO, parsearAlturaPrefectura } from './prefectura';

// Fila real de Prefectura (18/10/2026), registrada por la Edge Function registrar-nivel.
const celdas = (puerto: string, resto: string[]) => `<tr><td>${puerto}</td>${resto.map((c) => `<td>${c}</td>`).join('')}</tr>`;
const html = `<table>
  <tr><th>Puerto</th><th>Río</th><th>Altura</th><th>Var.</th><th>Per.</th><th>Fecha</th><th>Estado</th></tr>
  ${celdas('ITATI', ['PARANA', '7.60', '0.01', '2', '18/OCT/26 - 1400', 'EVACUACION CRECE', '', '7.59', '18/OCT/26 - 1200', '6.80', '7.30', ''])}
  ${celdas('PASO DE LA PATRIA', ['PARANA', '7.33', '0.02', '2', '18/OCT/26 - 1400', 'EVACUACION CRECE', '', '7.31', '18/OCT/26 - 1200', '6.50', '7.00', ''])}
  ${celdas('CORRIENTES', ['PARANA', '6.92', '-0.01', '2', '18/OCT/26 - 1400', 'ALERTA BAJA', '', '6.93', '18/OCT/26 - 1200', '6.50', '7.00', ''])}
</table>`;

describe('parsearAlturaPrefectura', () => {
  it('lee la fila real de Paso de la Patria', () => {
    expect(parsearAlturaPrefectura(html, 'Paso de la Patria')).toEqual({
      altura_m: 7.33,
      variacion_m: 0.02,
      fecha: '2026-10-18T14:00:00-03:00',
      estado: 'EVACUACION CRECE',
      alerta_m: 6.5,
      evacuacion_m: 7.0,
    });
  });

  it('devuelve null si el puerto no está', () => {
    expect(parsearAlturaPrefectura(html, 'Rosario')).toBeNull();
  });

  it('no confunde puertos con nombres parecidos y lee bajantes', () => {
    const c = parsearAlturaPrefectura(html, 'Corrientes');
    expect(c?.altura_m).toBe(6.92);
    expect(c?.variacion_m).toBe(-0.01);
  });
});

describe('fechaISO', () => {
  it.each([
    ['18/OCT/26 - 1400', '2026-10-18T14:00:00-03:00'],
    ['1/SET/26 - 0800', '2026-09-01T08:00:00-03:00'],
    ['18/10/2026 14:00', '2026-10-18T14:00:00-03:00'],
  ])('%s', (entrada, esperado) => expect(fechaISO(entrada)).toBe(esperado));

  it('ignora textos que no son fechas', () => {
    expect(fechaISO('EVACUACION CRECE')).toBeNull();
    expect(fechaISO('18/XYZ/26')).toBeNull();
  });
});
