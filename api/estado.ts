// Función serverless de Vercel: GET /api/estado
// Última altura de Prefectura de TODAS las localidades, para el mapa regional. Una sola
// descarga de la tabla y caché de CDN de 30 min: aunque entren miles de personas, Prefectura
// recibe una consulta cada media hora y Supabase ninguna.
import { localidades } from '../shared/localidades/index.js';
import { parsearAlturaPrefectura } from '../shared/fuentes/prefectura.js';
import { bajarTablaPrefectura, json } from './_prefectura.js';

/** Lo que necesita el mapa regional de cada localidad (umbrales oficiales si vienen en la fila). */
export interface EstadoApi {
  altura_m: number;
  fecha: string | null;
  alerta_m: number | null;
  evacuacion_m: number | null;
}

export async function GET(): Promise<Response> {
  try {
    const html = await bajarTablaPrefectura();
    const estados: Record<string, EstadoApi> = {};
    for (const loc of Object.values(localidades)) {
      const fila = parsearAlturaPrefectura(html, loc.hidrometro.puertoPrefectura);
      // Las localidades sin fila en Prefectura quedan afuera: el mapa las muestra sin dato.
      if (fila) estados[loc.id] = { altura_m: fila.altura_m, fecha: fila.fecha, alerta_m: fila.alerta_m, evacuacion_m: fila.evacuacion_m };
    }
    return json(estados);
  } catch (e) {
    // El frontend cae a Supabase.
    return json({ error: (e as Error).message }, 502, 's-maxage=300');
  }
}
