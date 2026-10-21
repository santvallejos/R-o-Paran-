# AGENTS.md

This file provides guidance to Claude Code and others agents when working with code in this repository.

## Propósito del proyecto

Web que muestra, sobre un mapa 3D, cómo la crecida del río Paraná afecta a distintas localidades del NEA y del Bajo
Paraná (hoy Paso de la Patria, Itatí e Ituzaingó, Corrientes; Campana y Zárate, Buenos Aires): la altura oficial del
río y las zonas que se inundan a cada nivel. Es un proyecto **sin fines de lucro, educativo y práctico**. **No reemplaza ni compite con las fuentes oficiales** (Prefectura Naval,
INA, municipio, Defensa Civil) ni pretende ser fuente de confianza durante la emergencia: busca reflejar, en lo
posible, cómo la crecida afecta a cada zona.

Consecuencias para cualquier cambio:
- Mostrar siempre fuente, fecha/hora del dato y que es una **estimación**. No quitar ni suavizar el componente
  `Aviso` ni los avisos del README e `index.html`.
- Al ser no comercial se usan datos con licencias NC (p. ej. EOxCloudless, CC BY-NC-SA). Las atribuciones son
  obligatorias: los textos de `src/lib/creditos.ts` van **literales**, sin traducir ni resumir. Una fuente de datos
  nueva necesita su atribución ahí y en la tabla de licencias del README.
- Pensado primero para el celular.

Todo el proyecto está en castellano (rioplatense): identificadores, comentarios, docs y mensajes de commit
(título descriptivo en castellano, cuerpo con viñetas, sin prefijos tipo `feat:`).

## Comandos

```bash
npm install
npm run dev          # Vite en http://localhost:5173 (lee Supabase con la clave publicable de .env)
npm test             # vitest run (TS: modelo, parser de Prefectura, validación de localidades, API)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + vite build
npx vercel dev       # para tener /api/* en local

npx vitest run src/lib/inundacion.test.ts        # un archivo
npx vitest run -t "texto del it"                 # un test por nombre
```

Procesamiento del relieve (Python 3.11+, desde `procesamiento/`; en Windows/Git Bash el venv se activa con
`.venv/Scripts/activate`):

```bash
pip install -r requirements.txt
python -m pytest                                   # pytest.ini pone pythonpath=. y testpaths=tests
python -m pytest tests/test_relieve.py -k nombre   # un test
python procesar.py <id>                            # Copernicus + correcciones -> public/data/relieve/<id>/
python procesar.py <id> --subir                    # además carga zonas en Supabase (necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
python procesar.py <id> --solo-subir-archivos      # sube public/data/relieve/<id> al bucket `relieve`
python procesar.py <id> --dem x.tif --nombre-dem "..." [--sin-correccion-cobertura]
```

Migración de una localidad (Node 23.6+, que ejecuta TS sin compilar; en Windows correrlo desde Git Bash porque el
`>` de PowerShell 5 escribe UTF-16):

```bash
node scripts/sql-localidad.ts <id> > supabase/migrations/<AAAAMMDDhhmmss>_<id>.sql
```

**Deploy:** Vercel publica a producción con cada push a `claude/mvp-paso-de-la-patria` (proyecto `rio-parana`,
https://rio-parana-topaz.vercel.app). Un push es un deploy público.

## Arquitectura

Tres piezas: frontend React + Vite (`src/`), funciones serverless de Vercel (`api/`) y pipeline offline en Python
(`procesamiento/`), más Supabase (Postgres/PostGIS, Edge Function, Storage) en `supabase/`.

### Configuración por localidad: una sola fuente de verdad

`shared/localidades/<id>.json` define cada localidad (bbox, semillas del río, hidrómetro y cota del cero, umbrales,
simulador, serie del INA, parámetros de procesamiento). Lo leen la app, las funciones de `api/`, `procesar.py` y
`scripts/sql-localidad.ts` (que genera la migración de Supabase; no editar esas migraciones a mano).
`validar.test.ts` corre `validarLocalidad()` sobre todas las localidades registradas.

- El registro en `shared/localidades/index.ts` es **estático** y los imports llevan extensión `.js` y
  `with { type: 'json' }`: las funciones de `api/` corren como ESM de Node **sin empaquetar**. Todo lo que importe
  `api/` (incluido `shared/`) tiene que respetar eso.
- `scripts/` importa con extensión `.ts` (Node strip-types).
- Pasos completos para sumar una localidad: README, sección "Sumar otra localidad".

### Altura del río

- El parser de la tabla HTML de Prefectura vive en `supabase/functions/_shared/prefectura.ts` (la Edge Function de
  Deno sólo puede importar desde `supabase/functions`) y `shared/fuentes/prefectura.ts` lo reexporta para la app y
  la API.
- La app (`src/lib/nivel.ts`) prueba en orden: `GET /api/nivel` (CDN 30 min) → vista `ultima_lectura` de Supabase
  (la llena la Edge Function `registrar-nivel` cada 2 h vía `pg_cron`) → `public/data/nivel/<id>.json` (respaldo manual).
- `GET /api/estado` baja la tabla de Prefectura una sola vez para todas las localidades (mapa regional).
- Vercel publica como función todo archivo de `api/` salvo los que empiezan con `_`; por eso los tests de la API
  están en `test/`.
- Valores operativos (cota del cero, umbrales, pronóstico) se pisan en runtime con la tabla `localidades` de
  Supabase (`src/lib/localidad.ts`, sin redeploy); la Edge Function actualiza los umbrales con los oficiales.

### Modelo de inundación

`cota_agua = altura_hidrometro + cotaCero_m`. La cota del cero es la mayor fuente de incertidumbre (ver
`docs/calibracion.md`); `?cero=<valor>` la fuerza en la app para probar.

1. **Offline** (`procesar.py`): corrige el DEM (cobertura, mediana, piso, defensas) y corre un Priority-Flood
   (4 vecinos) desde las celdas de río. Para cada celda guarda la cota mínima del agua a la que queda conectada con
   el río. Salen `umbral.png`, `elev.png`, `cauce.png` (codificación Terrarium; `umbral = 9000` = nunca conectada),
   `modelo.json`, tiles 3D y la escena de la vista 3D.
2. **App**: `src/lib/modelo.worker.ts` carga esos PNG en un Web Worker; `inundada ⇔ umbral ≤ cota_agua`, así el
   simulador responde al instante. Si no hay relieve procesado, calcula lo mismo en el navegador con tiles públicos.
3. El algoritmo está duplicado en `src/lib/inundacion.ts` y `procesamiento/relieve/inundacion.py` con tests
   equivalentes: **un cambio en uno va en los dos**.

La capa de la app y `edificios.json` usan cotas absolutas: cambiar la cota del cero **no** requiere reprocesar el
relieve. Las `zonas_inundables` de Supabase sí dependen del cero: hay que correr `procesar.py <id> --subir`.

Los datos del relieve se leen de `public/data/relieve/<id>/` o, si está definida en el build `VITE_RELIEVE_BASE`, del
bucket `relieve` de Supabase Storage (`src/lib/relieve.ts`). Las rutas de tiles en `terreno.json` son relativas a la
carpeta de la localidad.

### Frontend

- `App.tsx`: sin `?localidad=` muestra el mapa regional; con localidad, `VistaLocalidad` con `key={id}` para
  desmontar worker, mapa y escena al cambiar. Navegación con el historial, sin recargar (`src/lib/navegacion.ts`).
- Mapa con MapLibre (`components/Mapa.tsx`, base satélite EOX / calles OpenFreeMap en `lib/mapaBase.ts`).
- Vista 3D con three.js en `src/vista3d/`, cargada con `lazy` sólo al abrirla (`?vista=3d`). Ver `docs/vista3d.md`.
- `vite.config.ts` separa MapLibre y React en chunks propios para la caché larga de `/assets` (`vercel.json`).

### Supabase

- `.env` está versionado a propósito: sólo tiene la URL y la clave **publicable** (sólo lectura por RLS). La clave
  de servicio se usa sólo en la Edge Function y en `procesar.py`, nunca en el repo ni en el frontend.
- Tablas, funciones RPC, Storage y carga manual de lecturas: `docs/supabase.md`.

## Documentación

- `docs/calibracion.md`: cota del cero del hidrómetro y cómo recalcularla con el INA.
- `docs/procesamiento.md`: pasos y salidas del pipeline de relieve.
- `docs/localidades-nea.md`: catálogo de estaciones del NEA y fichas de las localidades cargadas (también las del
  Bajo Paraná).
- `MEJORAS-DATOS.md`: datos faltantes que limitan la estimación, por impacto.
- `docs/contexto-proyecto.md`: documento de arranque (objetivos, fases, principios).
- `docs/skills/`: copia versionada de las skills del proyecto. Claude Code las lee de `.claude/skills/`, que está
  ignorada por git; al cambiar una skill hay que copiarla a las dos ubicaciones. Para sumar una localidad, zona o área,
  o ampliar el área de una existente, usar la skill `agregar-localidad`.
