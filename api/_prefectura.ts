// Helper compartido por las funciones de /api (el "_" inicial evita que Vercel lo publique
// como ruta). Baja la tabla HTML de alturas de Prefectura una vez por llamada.
import { URL_ALTURAS_PREFECTURA } from '../shared/fuentes/prefectura.js';

/** Respuesta JSON con caché de CDN (por defecto 30 min y 1 h más sirviendo la anterior). */
export const json = (body: unknown, status = 200, cache = 's-maxage=1800, stale-while-revalidate=3600') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

/** HTML de la tabla de alturas; tira error si Prefectura no responde en 15 s. */
export async function bajarTablaPrefectura(): Promise<string> {
  const res = await fetch(URL_ALTURAS_PREFECTURA, {
    headers: { 'user-agent': 'mapa-crecida-parana (proyecto informativo sin fines de lucro)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Prefectura respondió ${res.status}`);
  return res.text();
}
