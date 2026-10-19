import * as maplibregl from 'maplibre-gl';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { localidades, type Localidad } from '../../shared/localidades';
import { ESTILO_ESTADO, normalizar, obtenerEstadoRegion, type EstadoLocalidad } from '../lib/estadoRegion';
import { alClicNavegar, urlDeLocalidad } from '../lib/navegacion';
// Importar Mapa también deja configurado el worker de MapLibre (setWorkerUrl).
import { agregarCalles, aplicarBase, CAPAS_BASE, FUENTES_BASE, type Base } from '../lib/mapaBase';
// Mapa.tsx configura el worker de MapLibre al importarse; el mapa regional lo necesita igual.
import './Mapa';

interface Props {
  /** Abre una localidad. */
  onElegir: (id: string) => void;
  /** Id pedido en la URL que no existe: se avisa arriba de la lista. */
  desconocida?: string | null;
}

/** Encuadre del NEA [oeste, sur, este, norte]: Corrientes, Chaco, Formosa y Misiones. */
const NEA: [number, number, number, number] = [-63.4, -30.8, -53.6, -22.0];
/** Vista de respaldo antes de ajustar al encuadre. */
const CENTRO_NEA: [number, number] = [-58.8, -27.5];
const ZOOM_NEA = 6.5;

const m = (h: number) => `${h.toFixed(2).replace('.', ',')} m`;

/** Encuadre que incluye el NEA y además todas las localidades (por si alguna queda afuera). */
function encuadre(locs: Localidad[]): LngLatBoundsLike {
  const b = new maplibregl.LngLatBounds([NEA[0], NEA[1]], [NEA[2], NEA[3]]);
  for (const l of locs) b.extend(l.centro);
  return b;
}

/** En el celular la hoja inferior tapa la mitad de abajo; en escritorio, la columna derecha. */
function margenes() {
  return window.innerWidth < 820
    ? { top: 60, bottom: window.innerHeight * 0.5 + 16, left: 16, right: 16 }
    : { top: 60, bottom: 24, left: 24, right: 420 };
}

/**
 * Pantalla regional: mapa del NEA con un marcador por localidad coloreado según la última
 * altura respecto de sus umbrales, y una hoja inferior con buscador y lista.
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

  // Lista fija de localidades ordenada por nombre.
  const todas = useMemo(() => Object.values(localidades).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), []);

  // Filtro por nombre (o provincia) sin distinguir tildes ni mayúsculas.
  const visibles = useMemo(() => {
    const q = normalizar(filtro.trim());
    return q ? todas.filter((l) => normalizar(`${l.nombre} ${l.provincia}`).includes(q)) : todas;
  }, [todas, filtro]);

  useEffect(() => {
    document.title = 'Crecida del río Paraná · NEA';
    obtenerEstadoRegion(todas).then(setEstados);
  }, [todas]);

  // Mapa base: se crea una sola vez y se encuadra en el NEA.
  useEffect(() => {
    const mp = new maplibregl.Map({
      container: contenedor.current!,
      style: { version: 8, sources: { ...FUENTES_BASE }, layers: [...CAPAS_BASE] },
      center: CENTRO_NEA,
      zoom: ZOOM_NEA,
      attributionControl: { compact: true },
    });
    // fitBounds en lugar de un zoom fijo: en el celular el NEA entero no entra a 6,5.
    mp.fitBounds(encuadre(todas), { padding: margenes(), animate: false });
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
  }, [todas]);

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
    return () => marcadores.forEach((mk) => mk.remove());
  }, [todas, estados, onElegir]);

  return (
    <div className="app">
      <div className="aviso" role="note">
        <strong>Estimación.</strong> No reemplaza las indicaciones oficiales de Prefectura, el municipio y Defensa Civil.
      </div>
      <div className="mapa">
        <div ref={contenedor} className="mapa__lienzo" />
        <div className="mapa__controles mapa__controles--region">
          <button type="button" onClick={() => setBase(base === 'satelite' ? 'calles' : 'satelite')}>
            {base === 'satelite' ? 'Ver calles' : 'Ver satélite'}
          </button>
        </div>
      </div>

      {/* Hoja inferior (columna lateral en escritorio) con el mismo estilo que el panel de una localidad. */}
      <section className={`panel ${abierto ? '' : 'panel--cerrado'}`} aria-label="Localidades del NEA">
        <button type="button" className="panel__asa" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
          <span className="panel__titulo">Río Paraná · NEA</span>
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
          <div className="buscador">
            <label htmlFor="buscar-localidad" className="tarjeta__etiqueta">
              Buscar localidad
            </label>
            <input
              id="buscar-localidad"
              type="search"
              placeholder="Nombre o provincia"
              autoComplete="off"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              aria-controls="lista-localidades"
            />
          </div>
          {/* Cantidad de resultados anunciada al escribir. */}
          <p className="oculto-visual" aria-live="polite">
            {visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'}
          </p>

          {visibles.length === 0 ? (
            <p className="tarjeta__texto">Ninguna localidad coincide con «{filtro}».</p>
          ) : (
            <ul className="lista-localidades" id="lista-localidades">
              {visibles.map((l) => {
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
                      </span>
                      <span className="chip" style={{ background: estilo.color }}>
                        {estados === undefined ? 'Consultando' : estilo.texto}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="aviso-chico">
            El color compara la última altura registrada con los umbrales de alerta y evacuación de cada localidad. Tocá una para ver el mapa de
            crecida.
          </p>
        </div>
      </section>
    </div>
  );
}
