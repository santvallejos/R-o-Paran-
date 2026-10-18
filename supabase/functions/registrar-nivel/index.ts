// Registra la altura oficial del río (Prefectura Naval) para cada localidad activa.
// La llama pg_cron cada 2 horas (ver supabase/migrations/*_cron_registrar_nivel.sql).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { celdasDelPuerto, parsearAlturaPrefectura, URL_ALTURAS_PREFECTURA } from '../_shared/prefectura.ts';

const FUENTE = 'Prefectura Naval Argentina';
// Evita consultar a Prefectura más seguido de lo necesario si alguien llama la función a mano.
const INTERVALO_MINIMO_MIN = 20;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const forzar = new URL(req.url).searchParams.has('forzar');

  if (!forzar) {
    const { data: ultima } = await sb
      .from('lecturas_nivel')
      .select('registrado_en')
      .eq('modo', 'automatico')
      .order('registrado_en', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultima && Date.now() - new Date(ultima.registrado_en).getTime() < INTERVALO_MINIMO_MIN * 60_000) {
      return json({ omitido: true, motivo: `Última consulta hace menos de ${INTERVALO_MINIMO_MIN} min` });
    }
  }

  const { data: localidades, error } = await sb
    .from('localidades')
    .select('id, puerto_prefectura')
    .eq('activa', true)
    .not('puerto_prefectura', 'is', null);
  if (error) return json({ error: error.message }, 500);

  let html: string;
  try {
    const res = await fetch(URL_ALTURAS_PREFECTURA, {
      headers: { 'user-agent': 'mapa-crecida-parana (proyecto informativo sin fines de lucro)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Prefectura respondió ${res.status}`);
    html = await res.text();
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }

  const resultados = [];
  for (const loc of localidades ?? []) {
    const fila = parsearAlturaPrefectura(html, loc.puerto_prefectura!);
    if (!fila) {
      resultados.push({ localidad: loc.id, error: 'Puerto no encontrado en la tabla' });
      continue;
    }
    if (!fila.fecha) {
      resultados.push({ localidad: loc.id, error: 'La fila no tiene fecha legible', altura_m: fila.altura_m, celdas: celdasDelPuerto(html, loc.puerto_prefectura!) });
      continue;
    }
    const { error: e } = await sb.from('lecturas_nivel').upsert(
      {
        localidad_id: loc.id,
        altura_m: fila.altura_m,
        variacion_m: fila.variacion_m,
        medido_en: fila.fecha,
        fuente: FUENTE,
        url: URL_ALTURAS_PREFECTURA,
        estado: fila.estado,
        modo: 'automatico',
      },
      { onConflict: 'localidad_id,fuente,medido_en', ignoreDuplicates: true },
    );
    if (fila.alerta_m !== null && fila.evacuacion_m !== null) {
      // Los umbrales oficiales de Prefectura mandan sobre los cargados a mano.
      await sb
        .from('localidades')
        .update({
          umbrales: [
            { nombre: 'Alerta', altura_m: fila.alerta_m, color: '#f59e0b' },
            { nombre: 'Evacuación', altura_m: fila.evacuacion_m, color: '#dc2626' },
          ],
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', loc.id);
    }
    resultados.push({ localidad: loc.id, altura_m: fila.altura_m, medido_en: fila.fecha, estado: fila.estado, error: e?.message });
  }
  return json({ resultados });
});
