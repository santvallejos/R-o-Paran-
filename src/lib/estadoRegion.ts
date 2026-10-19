// Estado de todas las localidades para el mapa regional: última altura y en qué rango
// cae respecto de los umbrales (alerta / evacuación). Dos consultas en total a Supabase,
// sin importar cuántas localidades haya.
import type { Localidad, Umbral } from '../../shared/localidades';
import { consultar, supabaseConfigurado } from './supabase';

export type Estado = 'evacuacion' | 'alerta' | 'normal' | 'sin-dato';

export interface EstadoLocalidad {
  altura_m: number | null;
  /** Fecha de la medición (ISO 8601). */
  fecha: string | null;
  estado: Estado;
}

/** Color y texto de cada estado; los de alerta y evacuación son los mismos que usan los umbrales. */
export const ESTILO_ESTADO: Record<Estado, { color: string; texto: string }> = {
  evacuacion: { color: '#dc2626', texto: 'Evacuación' },
  alerta: { color: '#f59e0b', texto: 'Alerta' },
  normal: { color: '#16a34a', texto: 'Normal' },
  'sin-dato': { color: '#94a3b8', texto: 'Sin dato' },
};

/** Saca tildes y pasa a minúsculas para comparar nombres ("Evacuación" = "evacuacion"). */
export const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Busca los umbrales de alerta y evacuación por nombre. Si los nombres no los dicen,
 * se toma el más alto como evacuación y el anterior como alerta.
 */
function umbralesClave(umbrales: Umbral[]) {
  const orden = [...umbrales].sort((a, b) => a.altura_m - b.altura_m);
  const porNombre = (p: string) => orden.find((u) => normalizar(u.nombre).includes(p));
  const evacuacion = porNombre('evacu') ?? (orden.length >= 2 ? orden[orden.length - 1] : undefined);
  const alerta = porNombre('alert') ?? orden.find((u) => u !== evacuacion);
  return { alerta, evacuacion };
}

/** Clasifica una altura: ≥ evacuación, ≥ alerta, normal; sin altura → sin dato. */
export function clasificar(altura: number | null, umbrales: Umbral[]): Estado {
  if (altura === null || !Number.isFinite(altura)) return 'sin-dato';
  const { alerta, evacuacion } = umbralesClave(umbrales);
  if (evacuacion && altura >= evacuacion.altura_m) return 'evacuacion';
  if (alerta && altura >= alerta.altura_m) return 'alerta';
  return 'normal';
}

interface FilaLectura {
  localidad_id: string;
  altura_m: number;
  medido_en: string;
}

interface FilaUmbrales {
  id: string;
  umbrales: Umbral[] | null;
}

/**
 * Última lectura y estado de cada localidad, por id. Sin Supabase (o si falla) todas
 * quedan "sin dato"; si sólo fallan los umbrales operativos se usan los del repo.
 */
export async function obtenerEstadoRegion(locs: Localidad[]): Promise<Record<string, EstadoLocalidad>> {
  const vacio = (): EstadoLocalidad => ({ altura_m: null, fecha: null, estado: 'sin-dato' });
  const resultado: Record<string, EstadoLocalidad> = Object.fromEntries(locs.map((l) => [l.id, vacio()]));
  if (!supabaseConfigurado || locs.length === 0) return resultado;

  // Los ids sólo tienen [a-z0-9-] (lo exige la tabla), igual se codifican por las dudas.
  const ids = locs.map((l) => encodeURIComponent(l.id)).join(',');
  // Ambas consultas en paralelo: la vista con la última lectura y los umbrales operativos.
  const [lecturas, umbrales] = await Promise.all([
    consultar<FilaLectura[]>(`ultima_lectura?localidad_id=in.(${ids})&select=localidad_id,altura_m,medido_en`).catch(() => []),
    consultar<FilaUmbrales[]>(`localidades?id=in.(${ids})&select=id,umbrales`).catch(() => []),
  ]);
  const umbralesPorId = new Map(umbrales.filter((f) => f.umbrales?.length).map((f) => [f.id, f.umbrales!]));

  for (const l of locs) {
    const f = lecturas.find((x) => x.localidad_id === l.id);
    if (!f) continue;
    const altura = Number(f.altura_m);
    resultado[l.id] = {
      altura_m: Number.isFinite(altura) ? altura : null,
      fecha: f.medido_en,
      estado: clasificar(altura, umbralesPorId.get(l.id) ?? l.umbrales),
    };
  }
  return resultado;
}
