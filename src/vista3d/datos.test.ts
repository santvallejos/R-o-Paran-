import { describe, expect, it } from 'vitest';
import { decodificarArboles, decodificarEdificios } from './datos';

describe('datos de la escena 3D', () => {
  it('decodifica árboles (cuartos de metro y escala·100)', () => {
    const a = decodificarArboles(Uint16Array.from([400, 800, 120, 4, 8, 60]).buffer);
    expect(Array.from(a.x)).toEqual([100, 1]);
    expect(Array.from(a.z)).toEqual([200, 2]);
    expect(a.escala[0]).toBeCloseTo(1.2);
  });

  it('decodifica edificios con y sin cota de agua', () => {
    const [e1, e2] = decodificarEdificios({ unidad_m: 0.25, e: [[5040, 60, 5000, 0, 0, 40, 0, 40, 40], [null, 35, 5210, 4, 4, 8, 4, 8, 8]] });
    expect(e1).toMatchObject({ cotaAgua: 50.4, altura_m: 6, base_m: 50 });
    expect(Array.from(e1.contorno)).toEqual([0, 0, 10, 0, 10, 10]);
    expect(e2.cotaAgua).toBeNull();
  });
});
