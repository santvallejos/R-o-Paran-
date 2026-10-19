import type { Localidad, LonLat } from './types.js';

// Tolerancia para comparar alturas en metros (evita falsos errores por redondeo de flotantes).
const EPS = 1e-9;

/** Mismo formato que exige la columna `localidades.id` en Supabase. */
const ID_VALIDO = /^[a-z0-9-]+$/;

/**
 * Revisa la coherencia de la configuración de una localidad antes de publicarla.
 * Devuelve la lista de errores en castellano; vacía si está todo bien.
 */
export function validarLocalidad(loc: Localidad): string[] {
  const errores: string[] = [];
  const error = (msg: string) => errores.push(`${loc.id || '(sin id)'}: ${msg}`);

  if (!ID_VALIDO.test(loc.id)) error(`id "${loc.id}" inválido (sólo minúsculas, números y guiones)`);

  // Área de estudio: [oeste, sur, este, norte], con los bordes en el orden correcto.
  const [oeste, sur, este, norte] = loc.bbox;
  const bboxOk = loc.bbox.length === 4 && loc.bbox.every(Number.isFinite) && oeste < este && sur < norte;
  if (!bboxOk) error(`bbox inválido [${loc.bbox.join(', ')}]: tiene que ser [oeste, sur, este, norte] con O < E y S < N`);

  // Centro del mapa y semillas del río tienen que caer dentro del área de estudio
  // (sólo se puede comprobar si el bbox es válido).
  const dentro = ([lon, lat]: LonLat) => lon >= oeste && lon <= este && lat >= sur && lat <= norte;
  if (bboxOk) {
    if (!dentro(loc.centro)) error(`centro [${loc.centro.join(', ')}] fuera del bbox`);
    if (!loc.semillasRio.length) error('no tiene semillasRio');
    loc.semillasRio.forEach((s, i) => {
      if (!dentro(s)) error(`semillasRio[${i}] [${s.join(', ')}] fuera del bbox`);
    });
  }

  // Simulador: rango creciente y paso positivo.
  const { min_m, max_m, paso_m } = loc.simulador;
  const simOk = Number.isFinite(min_m) && Number.isFinite(max_m) && min_m < max_m;
  if (!simOk) error(`simulador: min_m (${min_m}) tiene que ser menor que max_m (${max_m})`);
  if (!(paso_m > 0)) error(`simulador: paso_m (${paso_m}) tiene que ser mayor que 0`);

  // Umbrales: tienen que poder alcanzarse con el simulador.
  if (simOk) {
    for (const u of loc.umbrales) {
      if (!(u.altura_m >= min_m - EPS && u.altura_m <= max_m + EPS)) {
        error(`umbral "${u.nombre}" (${u.altura_m} m) fuera del rango del simulador [${min_m}, ${max_m}]`);
      }
    }
  }

  // Serie del INA: id entero positivo de la API a5.
  if (loc.ina && !(Number.isInteger(loc.ina.serieAltura) && loc.ina.serieAltura > 0)) {
    error(`ina.serieAltura (${loc.ina.serieAltura}) tiene que ser un entero positivo`);
  }

  if (!Number.isFinite(loc.hidrometro.cotaCero_m)) error(`hidrometro.cotaCero_m (${loc.hidrometro.cotaCero_m}) no es un número`);

  // Zonas precalculadas: rango creciente con paso positivo, y que cubra todo el simulador.
  // Si no lo cubre, en los extremos el mapa mostraría la zona de otro nivel (o ninguna),
  // porque zona_inundable() toma el nivel precalculado inmediatamente inferior.
  const n = loc.procesamiento?.nivelesZonas_m;
  if (n) {
    if (!(n.desde < n.hasta)) error(`procesamiento.nivelesZonas_m: desde (${n.desde}) tiene que ser menor que hasta (${n.hasta})`);
    if (!(n.paso > 0)) error(`procesamiento.nivelesZonas_m: paso (${n.paso}) tiene que ser mayor que 0`);
    if (simOk && (n.desde > min_m + EPS || n.hasta < max_m - EPS)) {
      error(`procesamiento.nivelesZonas_m [${n.desde}, ${n.hasta}] no cubre el rango del simulador [${min_m}, ${max_m}]`);
    }
  }

  return errores;
}
