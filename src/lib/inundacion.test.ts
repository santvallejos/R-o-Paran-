import { describe, expect, it } from 'vitest';
import { calcularUmbrales, superficieInundada } from './inundacion';

// 0 = río; el pozo de la derecha (1) está más bajo que el borde (5) que lo separa.
//   0 2 5 1
//   0 3 5 1
const elev = new Float32Array([0, 2, 5, 1, 0, 3, 5, 1]);

describe('calcularUmbrales', () => {
  const u = calcularUmbrales(elev, 4, 2, [0]);

  it('el río se inunda a su propia cota', () => {
    expect(u[0]).toBe(0);
    expect(u[4]).toBe(0);
  });

  it('las celdas conectadas se inundan a su cota', () => {
    expect(u[1]).toBe(2);
    expect(u[5]).toBe(3);
  });

  it('un pozo aislado sólo se inunda cuando el agua supera el borde', () => {
    expect(u[3]).toBe(5);
    expect(u[7]).toBe(5);
  });

  it('sin semillas no se inunda nada', () => {
    expect(Array.from(calcularUmbrales(elev, 4, 2, []))).toEqual(new Array(8).fill(Infinity));
  });
});

describe('superficieInundada', () => {
  it('cuenta hectáreas fuera del cauce', () => {
    const u = calcularUmbrales(elev, 4, 2, [0]);
    const cauce = Uint8Array.from(elev, (e) => (e === 0 ? 1 : 0));
    // a cota 2.5 se inunda sólo la celda de cota 2 (el cauce, cota 0, no cuenta)
    expect(superficieInundada(u, cauce, 2.5, 100)).toBe(1);
    expect(superficieInundada(u, cauce, 5, 100)).toBe(6);
  });
});
