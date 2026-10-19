// Imprime el upsert de `public.localidades` para una localidad, a partir de su JSON.
// Así shared/localidades/<id>.json es la única fuente de verdad y la migración se genera:
//
//   node scripts/sql-localidad.ts itati > supabase/migrations/<fecha>_itati.sql
//
// Node 23.6+ ejecuta TypeScript sin compilar (sólo quita los tipos); con Node 22 agregar
// `--experimental-strip-types`. Por eso los imports locales llevan la extensión `.ts`.
import { readFileSync } from 'node:fs';
import type { Localidad } from '../shared/localidades/types.ts';
import { validarLocalidad } from '../shared/localidades/validar.ts';

/** Literal de texto SQL: comillas simples duplicadas; `null` si no hay valor. */
function texto(v: string | null | undefined): string {
  return v == null ? 'null' : `'${v.replace(/'/g, "''")}'`;
}

/** Literal jsonb (como texto; Postgres lo convierte al insertar en la columna jsonb). */
function json(v: unknown): string {
  return v == null ? 'null' : texto(JSON.stringify(v));
}

/** Arma el `insert ... on conflict do update` con los datos operativos de la localidad. */
function sqlLocalidad(loc: Localidad, origen: string): string {
  const h = loc.hidrometro;
  return `-- Localidad ${loc.nombre} (${loc.provincia}). Generado desde ${origen} con
-- \`node scripts/sql-localidad.ts ${loc.id}\`: no editar a mano, cambiar el JSON y regenerar.
-- Los valores operativos se pueden ajustar después en Supabase sin redeploy; los umbrales
-- los pisa la Edge Function registrar-nivel con los oficiales de Prefectura.
insert into public.localidades (id, nombre, provincia, rio, puerto_prefectura, cota_cero_m, cota_cero_provisoria, umbrales, pronostico)
values (
  ${texto(loc.id)}, ${texto(loc.nombre)}, ${texto(loc.provincia)}, ${texto(loc.rio)}, ${texto(h.puertoPrefectura)}, ${h.cotaCero_m}, ${h.cotaCeroProvisoria},
  ${json(loc.umbrales)},
  ${json(loc.pronostico)}
)
on conflict (id) do update set
  nombre = excluded.nombre,
  provincia = excluded.provincia,
  rio = excluded.rio,
  puerto_prefectura = excluded.puerto_prefectura,
  cota_cero_m = excluded.cota_cero_m,
  cota_cero_provisoria = excluded.cota_cero_provisoria,
  umbrales = excluded.umbrales,
  -- Si el JSON no trae pronóstico, se conserva el que se haya cargado en Supabase.
  pronostico = coalesce(excluded.pronostico, public.localidades.pronostico),
  actualizado_en = now();
`;
}

// Uso por línea de comandos: lee el JSON, lo valida y escribe el SQL por stdout.
const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error('Uso: node scripts/sql-localidad.ts <id>   (p. ej. itati)');
  process.exit(1);
}
const origen = `shared/localidades/${id}.json`;
const loc = JSON.parse(readFileSync(new URL(`../${origen}`, import.meta.url), 'utf8')) as Localidad;

// No generar SQL de una configuración inconsistente.
const errores = validarLocalidad(loc);
if (errores.length) {
  console.error(`La configuración de ${id} tiene errores:\n- ${errores.join('\n- ')}`);
  process.exit(1);
}
process.stdout.write(sqlLocalidad(loc, origen));
