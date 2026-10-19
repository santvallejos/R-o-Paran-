import { describe, expect, it } from 'vitest';
import { agregarDiario, urlObservacionesIna, type ObservacionIna } from './ina';

// Observaciones con la forma real de la API a5 (serie 18, Paso de la Patria).
const obs = (timestart: string, valor: number | null): ObservacionIna => ({ series_id: 18, timestart, timeend: timestart, valor });

describe('urlObservacionesIna', () => {
  it('arma la consulta con fechas YYYY-MM-DD', () => {
    expect(urlObservacionesIna(18, new Date('2026-10-10T12:00:00Z'), new Date('2026-10-19T00:00:00Z'))).toBe(
      'https://alerta.ina.gob.ar/a5/obs/puntual/observaciones?series_id=18&timestart=2026-10-10&timeend=2026-10-19&format=json',
    );
  });
});

describe('agregarDiario', () => {
  it('se queda con el máximo de cada día', () => {
    expect(
      agregarDiario([obs('2026-10-15T03:00:00.000Z', 5.92), obs('2026-10-15T12:00:00.000Z', 5.95), obs('2026-10-15T21:00:00.000Z', 5.94)]),
    ).toEqual([{ fecha: '2026-10-15', altura_m: 5.95 }]);
  });

  it('descarta ceros, negativos y valores no numéricos', () => {
    expect(
      agregarDiario([
        obs('2026-10-14T12:00:00.000Z', 0),
        obs('2026-10-15T12:00:00.000Z', -1),
        obs('2026-10-16T12:00:00.000Z', null),
        { timestart: '2026-10-17T12:00:00.000Z', valor: 'NaN' },
        obs('2026-10-18T12:00:00.000Z', 7.33),
      ]),
    ).toEqual([{ fecha: '2026-10-18', altura_m: 7.33 }]);
  });

  it('ordena por fecha aunque lleguen desordenadas', () => {
    expect(agregarDiario([obs('2026-10-17T12:00:00.000Z', 7.2), obs('2026-10-15T12:00:00.000Z', 7.0), obs('2026-10-16T12:00:00.000Z', 7.1)]).map((d) => d.fecha)).toEqual([
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ]);
  });

  it('agrupa por día en hora argentina (UTC−3)', () => {
    // 02:00 UTC del 16 son las 23:00 del 15 en Argentina; 03:00 UTC ya es el 16.
    expect(agregarDiario([obs('2026-10-16T02:00:00.000Z', 6.1), obs('2026-10-16T03:00:00.000Z', 6.0)])).toEqual([
      { fecha: '2026-10-15', altura_m: 6.1 },
      { fecha: '2026-10-16', altura_m: 6.0 },
    ]);
  });
});
