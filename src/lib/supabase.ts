// Acceso de sólo lectura a Supabase vía PostgREST. Usa la clave publicable (pensada
// para el navegador); lo que se puede leer lo define RLS en supabase/migrations.
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CLAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigurado = Boolean(URL_SUPABASE && CLAVE);

export async function consultar<T>(ruta: string): Promise<T> {
  if (!supabaseConfigurado) throw new Error('Supabase no está configurado');
  const res = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, {
    // Con las claves nuevas (sb_publishable_…) alcanza con el header apikey.
    headers: { apikey: CLAVE!, accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);
  return (await res.json()) as T;
}
