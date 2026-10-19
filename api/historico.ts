// Función serverless de Vercel: GET /api/historico?localidad=paso-de-la-patria
// Devuelve la altura máxima diaria de los últimos 30 días según la serie del INA.
// El INA actualiza pocas veces por día: la CDN la cachea 6 h.
import { getLocalidad } from '../shared/localidades/index.js';
import { URL_MAPA_INA, serieDiariaIna, type SerieHistorica } from '../shared/fuentes/ina.js';

const DIAS = 30;

const json = (body: unknown, status = 200, cache = 's-maxage=21600, stale-while-revalidate=43200') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('localidad');
  const localidad = getLocalidad(id);
  if (!localidad) return json({ error: `Localidad desconocida: ${id}` }, 404, 'no-store');
  if (!localidad.ina) return json({ error: `${localidad.nombre} no tiene serie del INA` }, 404, 'no-store');

  try {
    const serie = await serieDiariaIna(localidad.ina.serieAltura, DIAS, {
      headers: { 'user-agent': 'mapa-crecida-parana (proyecto informativo sin fines de lucro)' },
      signal: AbortSignal.timeout(15000),
    });
    const respuesta: SerieHistorica = { serie, fuente: 'INA — Sistema de Información y Alerta Hidrológico', url: URL_MAPA_INA };
    return json(respuesta);
  } catch (e) {
    // El frontend reintenta contra el INA directo desde el navegador.
    return json({ error: (e as Error).message }, 502, 's-maxage=300');
  }
}
