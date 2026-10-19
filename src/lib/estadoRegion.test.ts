import { describe, expect, it } from 'vitest';
import { clasificar } from './estadoRegion';

// Umbrales como los de Prefectura para Paso de la Patria.
const umbrales = [
  { nombre: 'Alerta', altura_m: 6.5, color: '#f59e0b' },
  { nombre: 'Evacuación', altura_m: 7.0, color: '#dc2626' },
];

describe('clasificar', () => {
  it('sin altura no hay dato', () => {
    expect(clasificar(null, umbrales)).toBe('sin-dato');
    expect(clasificar(Number.NaN, umbrales)).toBe('sin-dato');
  });

  it('compara con los umbrales incluyendo el valor exacto', () => {
    expect(clasificar(6.49, umbrales)).toBe('normal');
    expect(clasificar(6.5, umbrales)).toBe('alerta');
    expect(clasificar(7.0, umbrales)).toBe('evacuacion');
    expect(clasificar(8.2, umbrales)).toBe('evacuacion');
  });

  it('no depende del orden ni de las tildes del nombre', () => {
    const otros = [
      { nombre: 'EVACUACION', altura_m: 5, color: '' },
      { nombre: 'alerta', altura_m: 4, color: '' },
    ];
    expect(clasificar(4.5, otros)).toBe('alerta');
    expect(clasificar(5, otros)).toBe('evacuacion');
  });

  it('con nombres desconocidos usa el más alto como evacuación', () => {
    const otros = [
      { nombre: 'Nivel 2', altura_m: 5, color: '' },
      { nombre: 'Nivel 1', altura_m: 4, color: '' },
    ];
    expect(clasificar(4.2, otros)).toBe('alerta');
    expect(clasificar(5.1, otros)).toBe('evacuacion');
  });

  it('sin umbrales todo es normal', () => {
    expect(clasificar(9, [])).toBe('normal');
  });
});
