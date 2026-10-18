// Función serverless de Vercel: GET /api/nivel?localidad=paso-de-la-patria
// Lee la altura oficial (Prefectura) y la devuelve normalizada. La CDN la cachea
// 30 min, así que no hace falta un cron para el MVP.
import { getLocalidad } from '../shared/localidades/index';
import type { LecturaNivel } from '../shared/fuentes/nivel';
import { URL_ALTURAS_PREFECTURA, parsearAlturaPrefectura } from '../shared/fuentes/prefectura';

const json = (body: unknown, status = 200, cache = 's-maxage=1800, stale-while-revalidate=3600') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('localidad');
  const localidad = getLocalidad(id);
  if (!localidad) return json({ error: `Localidad desconocida: ${id}` }, 404, 'no-store');

  try {
    const res = await fetch(URL_ALTURAS_PREFECTURA, {
      headers: { 'user-agent': 'mapa-crecida-parana (proyecto informativo sin fines de lucro)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Prefectura respondió ${res.status}`);
    const fila = parsearAlturaPrefectura(await res.text(), localidad.hidrometro.puertoPrefectura);
    if (!fila) throw new Error(`No se encontró el puerto ${localidad.hidrometro.puertoPrefectura}`);

    const lectura: LecturaNivel = {
      localidad: localidad.id,
      altura_m: fila.altura_m,
      variacion_m: fila.variacion_m,
      fecha: fila.fecha,
      fuente: 'Prefectura Naval Argentina',
      url: URL_ALTURAS_PREFECTURA,
      modo: 'automatico',
    };
    return json(lectura);
  } catch (e) {
    // El frontend cae al JSON manual de /data/nivel/<id>.json.
    return json({ error: (e as Error).message }, 502, 's-maxage=300');
  }
}
