// Función serverless de Vercel: GET /api/nivel?localidad=paso-de-la-patria
// Lee la altura oficial (Prefectura) y la devuelve normalizada. La CDN la cachea
// 30 min, así que no hace falta un cron para el MVP.
import { getLocalidad } from '../shared/localidades/index.js';
import type { LecturaNivel } from '../shared/fuentes/nivel.js';
import { URL_ALTURAS_PREFECTURA, parsearAlturaPrefectura } from '../shared/fuentes/prefectura.js';
import { bajarTablaPrefectura, json } from './_prefectura.js';

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('localidad');
  const localidad = getLocalidad(id);
  if (!localidad) return json({ error: `Localidad desconocida: ${id}` }, 404, 'no-store');

  try {
    const fila = parsearAlturaPrefectura(await bajarTablaPrefectura(), localidad.hidrometro.puertoPrefectura);
    if (!fila) throw new Error(`No se encontró el puerto ${localidad.hidrometro.puertoPrefectura}`);

    const lectura: LecturaNivel = {
      localidad: localidad.id,
      altura_m: fila.altura_m,
      variacion_m: fila.variacion_m,
      fecha: fila.fecha,
      estado: fila.estado,
      fuente: 'Prefectura Naval Argentina',
      url: URL_ALTURAS_PREFECTURA,
      modo: 'automatico',
    };
    return json(lectura);
  } catch (e) {
    // El frontend cae a Supabase y después al JSON manual de /data/nivel/<id>.json.
    return json({ error: (e as Error).message }, 502, 's-maxage=300');
  }
}
