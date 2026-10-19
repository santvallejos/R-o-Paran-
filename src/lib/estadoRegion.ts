// Estado de todas las localidades para el mapa regional: última altura y en qué rango
// cae respecto de los umbrales (alerta / evacuación). Una sola llamada a /api/estado (o, si
// falla, dos consultas a Supabase), sin importar cuántas localidades haya.
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

/** Fila de /api/estado (api/estado.ts): altura de Prefectura y sus umbrales oficiales. */
interface FilaApi {
  altura_m: number;
  fecha: string | null;
  alerta_m: number | null;
  evacuacion_m: number | null;
}

/**
 * Estado desde /api/estado, que la CDN de Vercel cachea 30 min: así miles de visitas no
 * llegan ni a Prefectura ni a Supabase. Devuelve null si la API no responde (p. ej. en
 * `npm run dev`, donde no hay funciones), para caer a Supabase.
 */
async function desdeApi(locs: Localidad[]): Promise<Record<string, EstadoLocalidad> | null> {
  try {
    const res = await fetch('/api/estado', { headers: { accept: 'application/json' } });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    const filas = (await res.json()) as Record<string, FilaApi>;
    return Object.fromEntries(
      locs.map((l): [string, EstadoLocalidad] => {
        const f = filas[l.id];
        if (!f) return [l.id, { altura_m: null, fecha: null, estado: 'sin-dato' }];
        // Umbrales oficiales de la fila de Prefectura; si no vienen, los del repo.
        const oficiales = [
          ...(f.alerta_m != null ? [{ nombre: 'Alerta', altura_m: f.alerta_m, color: '' }] : []),
          ...(f.evacuacion_m != null ? [{ nombre: 'Evacuación', altura_m: f.evacuacion_m, color: '' }] : []),
        ];
        return [l.id, { altura_m: f.altura_m, fecha: f.fecha, estado: clasificar(f.altura_m, oficiales.length ? oficiales : l.umbrales) }];
      }),
    );
  } catch {
    return null;
  }
}

/**
 * Última lectura y estado de cada localidad, por id. Primero la API cacheada; si falla,
 * Supabase. Sin ninguna de las dos, todas quedan "sin dato"; si sólo fallan los umbrales
 * operativos de Supabase se usan los del repo.
 */
export async function obtenerEstadoRegion(locs: Localidad[]): Promise<Record<string, EstadoLocalidad>> {
  const vacio = (): EstadoLocalidad => ({ altura_m: null, fecha: null, estado: 'sin-dato' });
  const resultado: Record<string, EstadoLocalidad> = Object.fromEntries(locs.map((l) => [l.id, vacio()]));
  if (locs.length === 0) return resultado;
  const api = await desdeApi(locs);
  if (api) return api;
  if (!supabaseConfigurado) return resultado;

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
