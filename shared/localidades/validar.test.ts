import { describe, expect, it } from 'vitest';
import { getLocalidad, listarLocalidades, localidades, type Localidad } from './index';
import { validarLocalidad } from './validar';

// Copia profunda de una localidad válida, con los cambios que pida cada caso de error.
const conCambios = (cambiar: (l: Localidad) => void): Localidad => {
  const l = structuredClone(localidades['paso-de-la-patria']);
  cambiar(l);
  return l;
};

describe('registro de localidades', () => {
  // Una sola prueba por localidad registrada: si alguien suma una mal cargada, falla acá.
  it.each(Object.entries(localidades))('%s es válida', (clave, loc) => {
    expect(loc.id).toBe(clave);
    expect(validarLocalidad(loc)).toEqual([]);
  });

  it('incluye Paso de la Patria e Itatí', () => {
    expect(getLocalidad('itati')?.nombre).toBe('Itatí');
    expect(getLocalidad(null)?.id).toBe('paso-de-la-patria');
  });

  it('listarLocalidades ordena por nombre', () => {
    const nombres = listarLocalidades().map((l) => l.nombre);
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')));
    expect(nombres).toEqual(expect.arrayContaining(['Itatí', 'Paso de la Patria']));
  });
});

describe('validarLocalidad', () => {
  it('rechaza un bbox con los bordes invertidos', () => {
    const errores = validarLocalidad(conCambios((l) => (l.bbox = [-58.52, -27.345, -58.63, -27.285])));
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/bbox inválido/);
  });

  it('rechaza el centro y las semillas fuera del bbox', () => {
    const errores = validarLocalidad(
      conCambios((l) => {
        l.centro = [-58.0, -27.3];
        l.semillasRio[1] = [-58.55, -27.0];
      }),
    );
    expect(errores).toEqual([expect.stringMatching(/centro .* fuera del bbox/), expect.stringMatching(/semillasRio\[1\] .* fuera del bbox/)]);
  });

  it('pide al menos una semilla del río', () => {
    expect(validarLocalidad(conCambios((l) => (l.semillasRio = [])))).toEqual([expect.stringMatching(/no tiene semillasRio/)]);
  });

  it('rechaza un simulador con rango invertido o paso no positivo', () => {
    const errores = validarLocalidad(conCambios((l) => (l.simulador = { min_m: 9, max_m: 5, paso_m: 0 })));
    expect(errores).toEqual([expect.stringMatching(/min_m .* menor que max_m/), expect.stringMatching(/paso_m .* mayor que 0/)]);
  });

  it('rechaza umbrales fuera del rango del simulador', () => {
    const errores = validarLocalidad(conCambios((l) => (l.umbrales[1].altura_m = 12)));
    expect(errores).toEqual([expect.stringMatching(/umbral "Evacuación" \(12 m\) fuera del rango/)]);
  });

  it('acepta umbrales justo en los extremos del simulador', () => {
    expect(validarLocalidad(conCambios((l) => (l.umbrales[0].altura_m = l.simulador.min_m)))).toEqual([]);
  });

  it('rechaza una serie del INA que no sea entero positivo', () => {
    expect(validarLocalidad(conCambios((l) => (l.ina = { serieAltura: 1.5 })))).toHaveLength(1);
    expect(validarLocalidad(conCambios((l) => (l.ina = { serieAltura: 0 })))).toHaveLength(1);
    // Sin serie del INA no hay nada que validar.
    expect(validarLocalidad(conCambios((l) => delete l.ina))).toEqual([]);
  });

  it('rechaza una cota del cero que no sea número', () => {
    expect(validarLocalidad(conCambios((l) => (l.hidrometro.cotaCero_m = NaN)))).toEqual([expect.stringMatching(/cotaCero_m/)]);
  });

  it('rechaza ids que Supabase no aceptaría', () => {
    expect(validarLocalidad(conCambios((l) => (l.id = 'Itatí')))).toEqual([expect.stringMatching(/id "Itatí" inválido/)]);
  });

  it('exige que las zonas precalculadas cubran el simulador', () => {
    const corta = validarLocalidad(conCambios((l) => (l.procesamiento!.nivelesZonas_m = { desde: 5, hasta: 9, paso: 0.1 })));
    expect(corta).toEqual([expect.stringMatching(/no cubre el rango del simulador/)]);
    // Un rango más amplio que el simulador está bien.
    expect(validarLocalidad(conCambios((l) => (l.procesamiento!.nivelesZonas_m = { desde: 4, hasta: 11, paso: 0.1 })))).toEqual([]);
    // Sin bloque de procesamiento no se valida.
    expect(validarLocalidad(conCambios((l) => delete l.procesamiento))).toEqual([]);
  });

  it('rechaza niveles de zonas invertidos o con paso no positivo', () => {
    const errores = validarLocalidad(conCambios((l) => (l.procesamiento!.nivelesZonas_m = { desde: 9.6, hasta: 5, paso: -0.1 })));
    expect(errores).toEqual(
      expect.arrayContaining([expect.stringMatching(/desde .* menor que hasta/), expect.stringMatching(/paso .* mayor que 0/)]),
    );
  });
});
