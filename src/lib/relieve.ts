// Dónde viven los datos pesados del relieve de cada localidad (salida de procesamiento/procesar.py:
// modelo.json, PNG del modelo, tiles 3D y escena). Con VITE_RELIEVE_BASE, la URL pública del bucket
// `relieve` de Supabase Storage (`<SUPABASE_URL>/storage/v1/object/public/relieve`), se leen de ahí;
// si no está definida, de public/data/relieve (desarrollo local o deploy con los datos en el repo).

/** Base del bucket sin barras finales, o undefined si no está configurada. Se lee en cada llamada
 * para que los tests puedan cambiarla con vi.stubEnv (en el build Vite la reemplaza por el valor). */
function baseConfigurada(): string | undefined {
  const base = (import.meta.env.VITE_RELIEVE_BASE as string | undefined)?.trim().replace(/\/+$/, '');
  return base || undefined;
}

/**
 * URL absoluta (sin barra final) de la carpeta con los datos de la localidad `id`.
 * `origen` sirve en el worker, que recibe el origen de la página; por defecto, location.origin.
 */
export function urlRelieve(id: string, origen?: string): string {
  const base = baseConfigurada();
  if (base) return `${base}/${id}`;
  return `${origen ?? location.origin}/data/relieve/${id}`;
}

/**
 * URL absoluta de la plantilla de tiles que trae terreno.json. Los archivos nuevos la guardan
 * relativa a la carpeta de la localidad (`terreno/{z}/{x}/{y}.png`); los viejos, como ruta del sitio
 * (`/data/relieve/<id>/terreno/…`), que se pasa a relativa para que también funcione con el bucket.
 * Una URL absoluta (http…) queda como está.
 */
export function resolverTiles(tiles: string, id: string, base: string): string {
  const prefijoViejo = `/data/relieve/${id}/`;
  const relativa = tiles.startsWith(prefijoViejo) ? tiles.slice(prefijoViejo.length) : tiles;
  // new URL codifica las llaves; MapLibre las necesita literales para reemplazar {z}, {x} e {y}.
  return new URL(relativa, `${base}/`).href.replace(/%7B/g, '{').replace(/%7D/g, '}');
}
