import { describe, expect, it } from 'vitest';
import { parsearAlturaPrefectura } from './prefectura';

const html = `
<table>
  <tr><th>Río</th><th>Puerto</th><th>Últ. registro</th><th>Variación</th><th>Período</th><th>Fecha</th><th>Estado</th></tr>
  <tr><td>PARANA</td><td>ITATI</td><td>6,90</td><td>0,04</td><td>24 hs</td><td>18/10/2026 08:00</td><td>CRECE</td></tr>
  <tr><td>PARANA</td><td>PASO DE LA PATRIA</td><td>6,72</td><td>-0,03</td><td>24 hs</td><td>18/10/2026 08:00</td><td>BAJA</td></tr>
  <tr><td>PARANA</td><td>CORRIENTES</td><td>6,40</td><td>0,02</td><td>24 hs</td><td>18/10/2026 08:00</td><td>CRECE</td></tr>
</table>`;

describe('parsearAlturaPrefectura', () => {
  it('toma la fila del puerto pedido', () => {
    expect(parsearAlturaPrefectura(html, 'Paso de la Patria')).toEqual({
      altura_m: 6.72,
      variacion_m: -0.03,
      fecha: '2026-10-18T08:00:00-03:00',
    });
  });

  it('devuelve null si el puerto no está', () => {
    expect(parsearAlturaPrefectura(html, 'Rosario')).toBeNull();
  });

  it('no confunde puertos con nombres parecidos', () => {
    expect(parsearAlturaPrefectura(html, 'Corrientes')?.altura_m).toBe(6.4);
  });
});
