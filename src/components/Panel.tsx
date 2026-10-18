import { useState, type CSSProperties } from 'react';
import type { LecturaNivel } from '../../shared/fuentes/nivel';
import type { Localidad } from '../../shared/localidades';
import { COLORES } from '../lib/capa';

interface Props {
  localidad: Localidad;
  lectura: LecturaNivel | null | undefined;
  alturaSim: number;
  onAlturaSim: (h: number) => void;
  cotaCero: number;
  onCotaCero: (c: number) => void;
  hectareas: { sim: number; actual: number | null } | null;
  estadoModelo: 'cargando' | 'listo' | string;
}

const m = (h: number) => `${h.toFixed(2).replace('.', ',')} m`;
const ha = (v: number) => `${Math.round(v).toLocaleString('es-AR')} ha`;
const rgb = (c: readonly number[]) => `rgb(${c.join(',')})`;

function fechaLegible(iso: string | null) {
  if (!iso) return 'sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }) + ' h';
}

export function Panel({ localidad, lectura, alturaSim, onAlturaSim, cotaCero, onCotaCero, hectareas, estadoModelo }: Props) {
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
                {superado && (
                  <span className="chip" style={{ background: superado.color }}>
                    Sobre {superado.nombre.toLowerCase()}
                  </span>
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
        </div>

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
          <ul className="leyenda">
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
          </ul>
        </div>

        <details className="detalles">
          <summary>Cómo se calcula</summary>
          <p>
            Se toma la altura del {localidad.hidrometro.nombre.toLowerCase()} y se pasa a cota sobre el nivel del mar sumando la cota del cero de la
            escala. Después se inunda sólo el terreno <strong>conectado con el río</strong> que queda por debajo de esa cota.
          </p>
          <p>
            Terreno: {localidad.dem.nombre}. Con esa resolución no se ven terraplenes ni defensas, y las zonas con árboles o edificios pueden parecer más
            altas de lo que son.
          </p>
          <label className="calibracion">
            Cota del cero del hidrómetro (m)
            <input type="number" step={0.05} value={cotaCero} onChange={(e) => Number.isFinite(e.target.valueAsNumber) && onCotaCero(e.target.valueAsNumber)} />
          </label>
          {localidad.hidrometro.cotaCeroProvisoria && (
            <p className="aviso-chico">Valor provisorio, a confirmar con INA o Prefectura. Si lo conocés, cambialo acá para ver el efecto.</p>
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
      </div>
    </section>
  );
}
