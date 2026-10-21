import { useState, type CSSProperties } from 'react';
import type { SerieHistorica } from '../../shared/fuentes/ina';
import type { LecturaNivel } from '../../shared/fuentes/nivel';
import type { Localidad, Umbral } from '../../shared/localidades';
import { COLORES } from '../lib/capa';
import type { MetaModelo } from '../lib/modelo.worker';
import { Autor } from './Autor';
import { SelectorLocalidad } from './SelectorLocalidad';

interface Props {
  localidad: Localidad;
  lectura: LecturaNivel | null | undefined;
  /** Altura diaria del INA. `undefined` mientras se consulta; `null` si no hay datos. */
  historico: SerieHistorica | null | undefined;
  alturaSim: number;
  onAlturaSim: (h: number) => void;
  cotaCero: number;
  onCotaCero: (c: number) => void;
  hectareas: { sim: number; actual: number | null } | null;
  estadoModelo: 'cargando' | 'listo' | string;
  metaModelo: MetaModelo | null;
  reproduciendo: boolean;
  onReproducir: () => void;
  /** En la vista 3D la leyenda va sobre la escena. */
  conLeyenda: boolean;
  /** Navega a otra localidad; `null` vuelve al mapa regional. */
  onLocalidad: (id: string | null) => void;
}

const m = (h: number) => `${h.toFixed(2).replace('.', ',')} m`;
const ha = (v: number) => `${Math.round(v).toLocaleString('es-AR')} ha`;
const rgb = (c: readonly number[]) => `rgb(${c.join(',')})`;

// También la usa la lista del mapa regional.
export function fechaLegible(iso: string | null) {
  if (!iso) return 'sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }) + ' h';
}

/** 'YYYY-MM-DD' → 'DD/MM' (o 'DD/MM/AAAA' con el año), sin pasar por Date para no correr el día por la zona horaria. */
function diaLegible(fecha: string, conAnio = false) {
  const [a, mes, d] = fecha.split('-');
  return conAnio ? `${d}/${mes}/${a}` : `${d}/${mes}`;
}

// Prefectura publica el estado en mayúsculas y sin tildes; estas son las palabras que las llevan.
const TILDES: Record<string, string> = {
  evacuacion: 'evacuación',
  estacion: 'estación',
  atencion: 'atención',
  precaucion: 'precaución',
  situacion: 'situación',
  minimo: 'mínimo',
  maximo: 'máximo',
  critico: 'crítico',
  critica: 'crítica',
};

/** "EVACUACION CRECE" → "Evacuación crece". */
function estadoLegible(estado: string) {
  const texto = estado.trim().toLowerCase().replace(/\p{L}+/gu, (p) => TILDES[p] ?? p);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Medidas del gráfico en unidades del viewBox; el SVG se escala al ancho de la tarjeta. */
const G = { ancho: 320, alto: 150, izq: 34, der: 8, arr: 10, abj: 18 };

/**
 * Altura diaria de los últimos días con las líneas de alerta y evacuación.
 * SVG en línea: no hace falta una librería para una sola serie.
 */
function GraficoHistorico({ serie, umbrales }: { serie: SerieHistorica['serie']; umbrales: Umbral[] }) {
  const alturas = serie.map((d) => d.altura_m);
  // El rango incluye los umbrales para que siempre se vea cuánto falta; se redondea a medio metro.
  const lo = Math.floor((Math.min(...alturas, ...umbrales.map((u) => u.altura_m)) - 0.1) * 2) / 2;
  const hi = Math.ceil((Math.max(...alturas, ...umbrales.map((u) => u.altura_m)) + 0.1) * 2) / 2;
  // Eje X por fecha real (no por índice), así un día sin dato no comprime la curva.
  const t = serie.map((d) => Date.parse(d.fecha));
  const t0 = t[0];
  const dt = t[t.length - 1] - t0 || 1;
  const x = (i: number) => G.izq + (serie.length === 1 ? 0.5 : (t[i] - t0) / dt) * (G.ancho - G.izq - G.der);
  const y = (h: number) => G.arr + ((hi - h) / (hi - lo)) * (G.alto - G.arr - G.abj);
  const ultimo = serie[serie.length - 1];
  const n = serie.length - 1;
  const num = (h: number) => h.toFixed(1).replace('.', ',');

  return (
    <svg
      className="grafico"
      viewBox={`0 0 ${G.ancho} ${G.alto}`}
      role="img"
      aria-label={`Altura del río del ${diaLegible(serie[0].fecha)} al ${diaLegible(ultimo.fecha)}: de ${m(alturas[0])} a ${m(ultimo.altura_m)}`}
    >
      {/* Marco del eje Y con el mínimo y el máximo del rango. */}
      <line className="grafico__eje" x1={G.izq} x2={G.ancho - G.der} y1={y(lo)} y2={y(lo)} />
      <line className="grafico__eje" x1={G.izq} x2={G.ancho - G.der} y1={y(hi)} y2={y(hi)} />
      <text className="grafico__texto" x={G.izq - 4} y={y(hi)} textAnchor="end" dominantBaseline="middle">
        {num(hi)} m
      </text>
      <text className="grafico__texto" x={G.izq - 4} y={y(lo)} textAnchor="end" dominantBaseline="middle">
        {num(lo)} m
      </text>

      {/* Umbrales oficiales: línea punteada con su nombre arriba a la izquierda (lejos del último punto). */}
      {umbrales.map((u) => (
        <g key={u.nombre}>
          <line x1={G.izq} x2={G.ancho - G.der} y1={y(u.altura_m)} y2={y(u.altura_m)} stroke={u.color} strokeWidth={1.5} strokeDasharray="4 3" />
          <text className="grafico__texto grafico__texto--umbral" x={G.izq + 3} y={y(u.altura_m) - 3} textAnchor="start" style={{ fill: u.color }}>
            {u.nombre} {m(u.altura_m)}
          </text>
        </g>
      ))}

      {/* Serie diaria y punto destacado en el último valor. */}
      <polyline className="grafico__linea" points={serie.map((d, i) => `${x(i).toFixed(1)},${y(d.altura_m).toFixed(1)}`).join(' ')} />
      <circle className="grafico__punto" cx={x(n)} cy={y(ultimo.altura_m)} r={4} />

      {/* Fechas inicial y final. */}
      <text className="grafico__texto" x={G.izq} y={G.alto - 4} textAnchor="start">
        {diaLegible(serie[0].fecha)}
      </text>
      <text className="grafico__texto" x={G.ancho - G.der} y={G.alto - 4} textAnchor="end">
        {diaLegible(ultimo.fecha)}
      </text>
    </svg>
  );
}

export function Panel({ localidad, lectura, historico, alturaSim, onAlturaSim, cotaCero, onCotaCero, hectareas, estadoModelo, metaModelo, reproduciendo, onReproducir, conLeyenda, onLocalidad }: Props) {
  const [abierto, setAbierto] = useState(true);
  const { simulador: s } = localidad;
  const actual = lectura?.altura_m ?? null;
  const superado = actual === null ? undefined : [...localidad.umbrales].reverse().find((u) => actual >= u.altura_m);
  const pct = (h: number) => `${((h - s.min_m) / (s.max_m - s.min_m)) * 100}%`;
  const delta = hectareas && hectareas.actual !== null ? hectareas.sim - hectareas.actual : null;

  return (
    <section className={`panel ${abierto ? '' : 'panel--cerrado'}`} aria-label="Panel de información">
      <button type="button" className="panel__asa" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <span className="panel__titulo">
          Río {localidad.rio} · {localidad.nombre}
        </span>
        <span className="panel__resumen">
          Simulando <strong>{m(alturaSim)}</strong> {abierto ? '▾' : '▴'}
        </span>
      </button>

      {/* Fuera del cuerpo plegable: aun con la hoja cerrada se puede cambiar de localidad. */}
      <SelectorLocalidad actual={localidad.id} onElegir={onLocalidad} />

      <div className="panel__cuerpo">
        <div className="tarjeta tarjeta--nivel">
          <div className="tarjeta__etiqueta">Altura oficial del río</div>
          {lectura === undefined ? (
            <div className="tarjeta__valor tarjeta__valor--tenue">Consultando…</div>
          ) : actual === null ? (
            <div className="tarjeta__texto">
              No hay una lectura automática disponible. Consultá el último parte en{' '}
              <a href={localidad.fuentes[0]?.url} target="_blank" rel="noreferrer">
                {localidad.fuentes[0]?.nombre}
              </a>
              .
            </div>
          ) : (
            <>
              <div className="tarjeta__fila">
                <span className="tarjeta__valor">{m(actual)}</span>
                {lectura?.variacion_m != null && (
                  <span className={`variacion ${lectura.variacion_m > 0 ? 'variacion--sube' : lectura.variacion_m < 0 ? 'variacion--baja' : ''}`}>
                    {lectura.variacion_m > 0 ? '▲' : lectura.variacion_m < 0 ? '▼' : '='} {Math.abs(lectura.variacion_m * 100).toFixed(0)} cm
                  </span>
                )}
                {lectura?.estado ? (
                  <span className="chip" style={{ background: superado?.color ?? '#e2e8f0' }} title="Estado publicado por la fuente oficial">
                    {estadoLegible(lectura.estado)}
                  </span>
                ) : (
                  superado && (
                    <span className="chip" style={{ background: superado.color }}>
                      Sobre {superado.nombre.toLowerCase()}
                    </span>
                  )
                )}
              </div>
              <div className="tarjeta__meta">
                {fechaLegible(lectura!.fecha)} ·{' '}
                {lectura!.url ? (
                  <a href={lectura!.url} target="_blank" rel="noreferrer">
                    {lectura!.fuente}
                  </a>
                ) : (
                  lectura!.fuente
                )}
                {lectura!.modo === 'manual' && ' (carga manual)'}
              </div>
            </>
          )}
        </div>

        <div className="simulador">
          <label htmlFor="altura" className="simulador__etiqueta">
            ¿Qué pasa si el río llega a… <strong>{m(alturaSim)}</strong>?
          </label>
          <div className="simulador__pista">
            {localidad.pronostico && (
              <div
                className="simulador__pronostico"
                style={{ left: pct(localidad.pronostico.desde_m), width: `calc(${pct(localidad.pronostico.hasta_m)} - ${pct(localidad.pronostico.desde_m)})` }}
                title={`Pronóstico de pico: ${m(localidad.pronostico.desde_m)} a ${m(localidad.pronostico.hasta_m)}`}
              />
            )}
            {localidad.umbrales.map((u) => (
              <div key={u.nombre} className="simulador__marca" style={{ left: pct(u.altura_m), '--c': u.color } as CSSProperties} title={`${u.nombre}: ${m(u.altura_m)}`} />
            ))}
            {actual !== null && <div className="simulador__marca simulador__marca--hoy" style={{ left: pct(actual) }} title={`Hoy: ${m(actual)}`} />}
            <input
              id="altura"
              type="range"
              min={s.min_m}
              max={s.max_m}
              step={s.paso_m}
              value={alturaSim}
              onChange={(e) => onAlturaSim(Number(e.target.value))}
            />
          </div>
          <div className="simulador__escala">
            <span>{m(s.min_m)}</span>
            <span>{m(s.max_m)}</span>
          </div>
          <div className="simulador__atajos">
            <button type="button" className="simulador__play" onClick={onReproducir} aria-pressed={reproduciendo}>
              {reproduciendo ? '❚❚ Pausar' : '▶ Simular subida'}
            </button>
            {actual !== null && (
              <button type="button" onClick={() => onAlturaSim(actual)}>
                Hoy ({m(actual)})
              </button>
            )}
            {localidad.umbrales.map((u) => (
              <button type="button" key={u.nombre} onClick={() => onAlturaSim(u.altura_m)}>
                {u.nombre} ({m(u.altura_m)})
              </button>
            ))}
            {localidad.pronostico && (
              <button type="button" onClick={() => onAlturaSim(localidad.pronostico!.hasta_m)} title={`Fuente: ${localidad.pronostico.fuente}`}>
                Pico pronosticado ({m(localidad.pronostico.hasta_m)})
              </button>
            )}
          </div>
          {/* Máximos históricos para comparar la crecida actual con las grandes. */}
          {localidad.crecidasHistoricas && localidad.crecidasHistoricas.length > 0 && (
            <>
              <div className="simulador__subtitulo">Crecidas de referencia</div>
              <div className="simulador__atajos simulador__atajos--historicas">
                {localidad.crecidasHistoricas.map((c) => (
                  <button type="button" key={c.fecha} onClick={() => onAlturaSim(c.altura_m)} title={`Máximo del ${diaLegible(c.fecha, true)}`}>
                    {c.nombre} ({m(c.altura_m)})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Últimos 30 días: va después del simulador para que en el celular la altura y el control queden arriba. */}
        {historico !== null && (
          <div className="tarjeta">
            <div className="tarjeta__etiqueta">Últimos 30 días</div>
            {historico === undefined ? (
              <div className="tarjeta__meta">Consultando INA…</div>
            ) : (
              <>
                <GraficoHistorico serie={historico.serie} umbrales={localidad.umbrales} />
                <div className="tarjeta__meta">
                  Máximo diario ·{' '}
                  <a href={historico.url} target="_blank" rel="noreferrer">
                    {historico.fuente}
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        <div className="tarjeta">
          {estadoModelo === 'cargando' && <div className="tarjeta__texto">Calculando zonas inundables…</div>}
          {estadoModelo !== 'cargando' && estadoModelo !== 'listo' && <div className="tarjeta__texto error">No se pudo calcular el modelo: {estadoModelo}</div>}
          {hectareas && (
            <div className="tarjeta__fila tarjeta__fila--stats">
              <div>
                <div className="tarjeta__etiqueta">Zona inundada estimada</div>
                <div className="tarjeta__valor tarjeta__valor--chico">{ha(hectareas.sim)}</div>
              </div>
              {delta !== null && (
                <div>
                  <div className="tarjeta__etiqueta">Respecto de hoy</div>
                  <div className="tarjeta__valor tarjeta__valor--chico">
                    {delta >= 0 ? '+' : '−'}
                    {ha(Math.abs(delta))}
                  </div>
                </div>
              )}
            </div>
          )}
          {conLeyenda && <ul className="leyenda">
            <li>
              <i style={{ background: rgb(COLORES.inundada) }} /> Inundado a la altura simulada
            </li>
            {actual !== null && (
              <>
                <li>
                  <i style={{ background: rgb(COLORES.seSuma) }} /> Se suma si el río sube
                </li>
                <li>
                  <i style={{ background: rgb(COLORES.seLibera) }} /> Se libera si el río baja
                </li>
              </>
            )}
            <li>
              <i style={{ background: rgb(COLORES.cauce) }} /> Cauce habitual del río (no suma hectáreas)
            </li>
          </ul>}
        </div>

        <details className="detalles">
          <summary>Cómo se calcula</summary>
          <p>
            Se toma la altura del {localidad.hidrometro.nombre.toLowerCase()} y se pasa a cota sobre el nivel del mar sumando la cota del cero de la
            escala. Después se inunda sólo el terreno <strong>conectado con el río</strong> que queda por debajo de esa cota.
          </p>
          {metaModelo?.precalculado ? (
            <p>
              Terreno: {metaModelo.fuenteDem} (procesado el {new Date(metaModelo.procesadoEn ?? '').toLocaleDateString('es-AR')}): se restó la altura
              típica de árboles y edificios, se filtró el ruido y se marcaron las defensas conocidas como barreras. Con ~30 m de resolución todavía
              puede no ver terraplenes chicos.
            </p>
          ) : (
            <p>
              Terreno: {metaModelo?.fuenteDem ?? localidad.dem.nombre}. Con esa resolución no se ven terraplenes ni defensas, y las zonas con árboles o
              edificios pueden parecer más altas de lo que son.
            </p>
          )}
          <label className="calibracion">
            Cota del cero del hidrómetro (m)
            <input type="number" step={0.05} value={cotaCero} onChange={(e) => Number.isFinite(e.target.valueAsNumber) && onCotaCero(e.target.valueAsNumber)} />
          </label>
          {/* La nota de calibración es propia de cada localidad (cómo se estimó su cero); si la cota
              es provisoria se invita a probar otro valor. Sin nota ni cota provisoria no se muestra nada. */}
          {(localidad.hidrometro.notaCalibracion || localidad.hidrometro.cotaCeroProvisoria) && (
            <p className="aviso-chico">
              {localidad.hidrometro.notaCalibracion}
              {localidad.hidrometro.notaCalibracion && localidad.hidrometro.cotaCeroProvisoria && ' '}
              {localidad.hidrometro.cotaCeroProvisoria && 'Si lo conocés, cambialo acá para ver el efecto.'}
            </p>
          )}
          <p>
            Cota del agua simulada: <strong>{(alturaSim + cotaCero).toFixed(2).replace('.', ',')} m</strong>
          </p>
          <ul className="fuentes">
            {localidad.fuentes.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  {f.nombre}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <Autor />
      </div>
    </section>
  );
}
