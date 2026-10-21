import * as maplibregl from 'maplibre-gl';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { agruparPorRegion, getRegion, listarLocalidades, type Localidad } from '../../shared/localidades';
import { ESTILO_ESTADO, estadoTodas, normalizar, type EstadoLocalidad } from '../lib/estadoRegion';
import { alClicNavegar, reemplazarRegion, regionDeUrl, urlDeLocalidad } from '../lib/navegacion';
import { Autor } from './Autor';
import { Aviso } from './Aviso';
import { fechaLegible } from './Panel';
import { agregarCalles, aplicarBase, CAPAS_BASE, FUENTES_BASE, type Base } from '../lib/mapaBase';
// Mapa.tsx configura el worker de MapLibre al importarse; el mapa regional lo necesita igual.
import './Mapa';

interface Props {
  /** Abre una localidad. */
  onElegir: (id: string) => void;
  /** Id pedido en la URL que no existe: se avisa arriba de la lista. */
  desconocida?: string | null;
}

// El registro de localidades es estático: se agrupa una sola vez.
const todas = listarLocalidades();
const grupos = agruparPorRegion(todas);

/** Zoom máximo al encuadrar: una región con una sola localidad no se acerca hasta las calles. */
const ZOOM_MAX_ENCUADRE = 10;

const m = (h: number) => `${h.toFixed(2).replace('.', ',')} m`;

/** Encuadre que abarca las áreas de estudio de las localidades. */
function encuadre(locs: Localidad[]): LngLatBoundsLike {
  const b = new maplibregl.LngLatBounds();
  for (const l of locs) b.extend(l.bbox);
  return b;
}

const deRegion = (region: string | null) => (region ? todas.filter((l) => l.region === region) : todas);

/**
 * En el celular la hoja inferior tapa la mitad de abajo; en escritorio, la columna derecha.
 * Arriba, lugar para el aviso y el botón de la base; a la derecha, para el nombre, que va al lado del punto.
 */
function margenes() {
  return window.innerWidth < 820
    ? { top: 90, bottom: window.innerHeight * 0.5 + 16, left: 24, right: 100 }
    : { top: 60, bottom: 24, left: 24, right: 500 };
}

/** "1 en evacuación · 2 en alerta"; vacío si ninguna está en alerta o evacuación (o no hay datos). */
function resumen(locs: Localidad[], estados: Record<string, EstadoLocalidad> | undefined) {
  const cuantas = (e: string) => locs.filter((l) => estados?.[l.id]?.estado === e).length;
  return [
    [cuantas('evacuacion'), 'en evacuación'],
    [cuantas('alerta'), 'en alerta'],
  ]
    .filter(([n]) => n)
    .map(([n, t]) => `${n} ${t}`)
    .join(' · ');
}

/**
 * Pantalla regional: mapa del río Paraná con un marcador por localidad coloreado según la última
 * altura respecto de sus umbrales, y una hoja inferior con filtro por región, buscador y lista agrupada.
 */
export function MapaRegion({ onElegir, desconocida }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const [listo, setListo] = useState(false);
  // Al nivel regional las calles muestran nombres y límites provinciales.
  const [base, setBase] = useState<Base>('calles');
  // Ids de las capas de calles (OpenFreeMap), que se agregan cuando el mapa termina de cargar.
  const [calles, setCalles] = useState<string[]>([]);
  // undefined: consultando; después, el estado por id (gris si no hay datos).
  const [estados, setEstados] = useState<Record<string, EstadoLocalidad> | undefined>(undefined);
  const [filtro, setFiltro] = useState('');
  const [abierto, setAbierto] = useState(true);
  // `null`: todas. Se ignora una región de la URL que no existe o no tiene localidades.
  const [region, setRegion] = useState<string | null>(() => {
    const r = regionDeUrl();
    return grupos.some((g) => g.region.id === r) ? r : null;
  });

  // Región elegida y, dentro de ella, filtro por nombre, provincia, región o río sin distinguir tildes ni mayúsculas.
  const visibles = useMemo(() => {
    const q = normalizar(filtro.trim());
    return grupos
      .filter((g) => !region || g.region.id === region)
      .map((g) => ({
        ...g,
        localidades: q ? g.localidades.filter((l) => normalizar(`${l.nombre} ${l.provincia} ${g.region.nombre} ${l.rio}`).includes(q)) : g.localidades,
      }))
      .filter((g) => g.localidades.length > 0);
  }, [filtro, region]);
  const cantidad = visibles.reduce((n, g) => n + g.localidades.length, 0);

  const elegirRegion = (id: string | null) => {
    setRegion(id);
    reemplazarRegion(id);
  };

  useEffect(() => {
    document.title = 'Crecida del río Paraná';
    let vigente = true;
    estadoTodas().then((e) => vigente && setEstados(e));
    return () => {
      vigente = false;
    };
  }, []);

  // Mapa base: se crea una sola vez, encuadrado en la región elegida (o en todas las localidades).
  useEffect(() => {
    const mp = new maplibregl.Map({
      container: contenedor.current!,
      style: { version: 8, sources: { ...FUENTES_BASE }, layers: [...CAPAS_BASE] },
      // bounds en lugar de un zoom fijo: se adapta al ancho del celular y a las localidades que haya.
      bounds: encuadre(deRegion(region)),
      fitBoundsOptions: { padding: margenes(), maxZoom: ZOOM_MAX_ENCUADRE },
      attributionControl: { compact: true },
    });
    mp.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mp.on('load', () => {
      setListo(true);
      // Calles visibles de entrada (es la base por defecto de esta pantalla).
      agregarCalles(mp, true).then(setCalles);
    });
    mapa.current = mp;
    return () => {
      mp.remove();
      mapa.current = null;
      setListo(false);
      setCalles([]);
    };
    // La región inicial sólo sirve al crear el mapa; los cambios los encuadra el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al elegir una región, el mapa viaja a sus localidades (al montar ya está encuadrado: no se mueve).
  const primerEncuadre = useRef(true);
  useEffect(() => {
    if (primerEncuadre.current) {
      primerEncuadre.current = false;
      return;
    }
    mapa.current?.fitBounds(encuadre(deRegion(region)), { padding: margenes(), maxZoom: ZOOM_MAX_ENCUADRE });
  }, [region]);

  useEffect(() => {
    const mp = mapa.current;
    if (!mp || !listo) return;
    aplicarBase(mp, base, calles);
  }, [base, listo, calles]);

  // Marcadores: un botón por localidad en su centro; se rehacen cuando llegan los estados.
  useEffect(() => {
    const mp = mapa.current;
    if (!mp) return;
    const marcadores = todas.map((l) => {
      const e = estados?.[l.id];
      const estilo = ESTILO_ESTADO[e?.estado ?? 'sin-dato'];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'marcador-region';
      el.style.setProperty('--c', estilo.color);
      // Texto para lectores de pantalla: nombre, altura y estado.
      el.setAttribute('aria-label', `${l.nombre}: ${e?.altura_m != null ? `${m(e.altura_m)}, ` : ''}${estilo.texto.toLowerCase()}`);
      el.innerHTML = '<span class="marcador-region__punto"></span><span class="marcador-region__nombre"></span>';
      el.querySelector('.marcador-region__nombre')!.textContent = l.nombre;
      el.addEventListener('click', () => onElegir(l.id));
      return new maplibregl.Marker({ element: el, anchor: 'left', offset: [-9, 0] }).setLngLat(l.centro).addTo(mp);
    });

    // Con poco zoom los nombres de localidades vecinas (Campana y Zárate) se pisan: se oculta el que
    // choca con un punto o con un nombre ya puesto. El punto sigue visible y se puede tocar.
    const despejar = () => {
      const caja = (el: Element) => el.getBoundingClientRect();
      const ocupadas = marcadores.map((mk) => caja(mk.getElement().querySelector('.marcador-region__punto')!));
      for (const mk of marcadores) {
        const nombre = mk.getElement().querySelector<HTMLElement>('.marcador-region__nombre')!;
        nombre.style.visibility = '';
        const r = caja(nombre);
        const pisa = ocupadas.some((o) => r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top);
        if (pisa) nombre.style.visibility = 'hidden';
        else ocupadas.push(r);
      }
    };
    despejar();
    mp.on('moveend', despejar);
    return () => {
      mp.off('moveend', despejar);
      marcadores.forEach((mk) => mk.remove());
    };
  }, [estados, onElegir]);

  const nombreRegion = getRegion(region)?.nombre;

  return (
    <div className="app">
      <Aviso />
      <div className="mapa">
        <div ref={contenedor} className="mapa__lienzo" />
        <div className="mapa__controles mapa__controles--region">
          <button type="button" onClick={() => setBase(base === 'satelite' ? 'calles' : 'satelite')}>
            {base === 'satelite' ? 'Ver calles' : 'Ver satélite'}
          </button>
        </div>
      </div>

      {/* Hoja inferior (columna lateral en escritorio) con el mismo estilo que el panel de una localidad. */}
      <section className={`panel ${abierto ? '' : 'panel--cerrado'}`} aria-label="Localidades del río Paraná">
        <button type="button" className="panel__asa" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
          <span className="panel__titulo">Río Paraná{nombreRegion ? ` · ${nombreRegion}` : ''}</span>
          <span className="panel__resumen">
            {todas.length} {todas.length === 1 ? 'localidad' : 'localidades'} {abierto ? '▾' : '▴'}
          </span>
        </button>

        <div className="panel__cuerpo">
          {desconocida && (
            <p className="tarjeta__texto error" role="alert">
              No encontramos la localidad «{desconocida}». Elegí una de la lista.
            </p>
          )}

          {/* Filtro por región: también encuadra el mapa. Con una sola región no hace falta. */}
          {grupos.length > 1 && (
            <div className="filtro-regiones" role="group" aria-label="Región">
              <button type="button" aria-pressed={region === null} onClick={() => elegirRegion(null)}>
                Todas <span>{todas.length}</span>
              </button>
              {grupos.map((g) => (
                <button key={g.region.id} type="button" aria-pressed={region === g.region.id} onClick={() => elegirRegion(g.region.id)}>
                  {g.region.nombre} <span>{g.localidades.length}</span>
                </button>
              ))}
            </div>
          )}

          <div className="buscador">
            <label htmlFor="buscar-localidad" className="tarjeta__etiqueta">
              Buscar localidad
            </label>
            <input
              id="buscar-localidad"
              type="search"
              placeholder="Nombre, provincia o región"
              autoComplete="off"
              enterKeyHint="go"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              // Enter con un único resultado lo abre directamente.
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cantidad === 1) onElegir(visibles[0].localidades[0].id);
              }}
              aria-controls="lista-localidades"
            />
          </div>
          {/* Cantidad de resultados anunciada al escribir o cambiar de región. */}
          <p className="oculto-visual" aria-live="polite">
            {cantidad} {cantidad === 1 ? 'resultado' : 'resultados'}
          </p>

          <div id="lista-localidades">
            {cantidad === 0 ? (
              <p className="tarjeta__texto">
                Ninguna localidad{nombreRegion ? ` de ${nombreRegion}` : ''} coincide con «{filtro}».{' '}
                {region && (
                  <button type="button" className="boton-enlace" onClick={() => elegirRegion(null)}>
                    Buscar en todas las regiones
                  </button>
                )}
              </p>
            ) : (
              visibles.map((g) => {
                const estadoGrupo = resumen(g.localidades, estados);
                return (
                  <section key={g.region.id} className="grupo-localidades" aria-labelledby={`region-${g.region.id}`}>
                    <h2 className="grupo-localidades__titulo" id={`region-${g.region.id}`}>
                      {g.region.nombre} <small>{g.provincias.join(', ')}</small>
                      {estadoGrupo && <span className="grupo-localidades__estado">{estadoGrupo}</span>}
                    </h2>
                    <ul className="lista-localidades">
                      {g.localidades.map((l) => {
                        const e = estados?.[l.id];
                        const estilo = ESTILO_ESTADO[e?.estado ?? 'sin-dato'];
                        return (
                          <li key={l.id}>
                            {/* Link real (se puede abrir en otra pestaña); con clic común navega sin recargar. */}
                            <a href={urlDeLocalidad(l.id)} onClick={(ev) => alClicNavegar(ev, () => onElegir(l.id))}>
                              <span className="lista-localidades__nombre">
                                {l.nombre}
                                <small>{l.provincia}</small>
                              </span>
                              <span className="lista-localidades__altura">
                                {estados === undefined ? '…' : e?.altura_m != null ? m(e.altura_m) : '—'}
                                {e?.fecha && <small>{fechaLegible(e.fecha)}</small>}
                              </span>
                              <span className="chip" style={{ background: estilo.color, color: estilo.tinta }}>
                                {estados === undefined ? 'Consultando' : estilo.texto}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
          <p className="aviso-chico">
            Altura y fecha de cada medición: Prefectura Naval Argentina. El color compara esa altura con los umbrales de alerta y evacuación de
            cada localidad. Tocá una para ver el mapa de crecida estimado.
          </p>
          <Autor />
        </div>
      </section>
    </div>
  );
}
