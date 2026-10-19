import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { SerieHistorica } from '../shared/fuentes/ina';
import type { LecturaNivel } from '../shared/fuentes/nivel';
import { localidades, type Localidad } from '../shared/localidades';
import { Mapa } from './components/Mapa';
import { MapaRegion } from './components/MapaRegion';
import { Panel } from './components/Panel';
import { superficieInundada } from './lib/inundacion';
import { conDatosOperativos, terrenoProcesado, type TerrenoProcesado } from './lib/localidad';
import { cargarModelo, type Modelo } from './lib/modelo';
import { obtenerHistorico } from './lib/historico';
import { empujarLocalidad, localidadDeUrl } from './lib/navegacion';
import { obtenerNivel } from './lib/nivel';

// three.js sólo se descarga si se abre la vista 3D.
const Escena3D = lazy(() => import('./vista3d/Escena3D'));
type Vista = 'mapa' | '3d';

/** `?cero=` fuerza la cota del cero (para probar calibraciones). Se lee al montar cada localidad. */
function ceroDeUrl(): number | null {
  const params = new URLSearchParams(location.search);
  const cero = Number(params.get('cero'));
  return params.has('cero') && Number.isFinite(cero) && cero > 0 ? cero : null;
}

/**
 * Raíz: decide entre la pantalla regional (sin `?localidad=` o con un id desconocido) y la
 * vista de una localidad. La navegación usa el historial del navegador sin recargar.
 */
export function App() {
  const [localidadId, setLocalidadId] = useState<string | null>(localidadDeUrl);

  // Atrás/adelante del navegador: la URL ya cambió, sólo hay que leerla.
  useEffect(() => {
    const alVolver = () => setLocalidadId(localidadDeUrl());
    addEventListener('popstate', alVolver);
    return () => removeEventListener('popstate', alVolver);
  }, []);

  // Estable para que el mapa regional no rehaga los marcadores en cada render.
  const navegar = useCallback((id: string | null) => {
    empujarLocalidad(id);
    setLocalidadId(id);
  }, []);

  const base = localidadId ? localidades[localidadId] : undefined;
  if (!base) return <MapaRegion onElegir={navegar} desconocida={localidadId} />;
  // `key`: al cambiar de localidad se desmonta todo (worker del modelo, mapa, escena 3D) y arranca limpio.
  return <VistaLocalidad key={base.id} base={base} onLocalidad={navegar} />;
}

interface PropsVista {
  base: Localidad;
  onLocalidad: (id: string | null) => void;
}

/** Mapa o vista 3D de una localidad con su panel. */
function VistaLocalidad({ base, onLocalidad }: PropsVista) {
  // Se leen una vez al montar: al cambiar de localidad `?cero=` ya se descartó de la URL.
  const [ceroForzado] = useState(ceroDeUrl);
  const [localidad, setLocalidad] = useState<Localidad>(base);
  const [terreno, setTerreno] = useState<TerrenoProcesado | null | undefined>(undefined);
  const [lectura, setLectura] = useState<LecturaNivel | null | undefined>(undefined);
  // undefined: consultando; null: sin datos del INA (el panel oculta el gráfico).
  const [historico, setHistorico] = useState<SerieHistorica | null | undefined>(undefined);
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [estadoModelo, setEstadoModelo] = useState('cargando');
  const [alturaSim, setAlturaSim] = useState<number | null>(null);
  const [cotaCero, setCotaCero] = useState(ceroForzado ?? base.hidrometro.cotaCero_m);
  const [vista, setVista] = useState<Vista>(() => (new URLSearchParams(location.search).get('vista') === '3d' ? '3d' : 'mapa'));
  const [reproduciendo, setReproduciendo] = useState(false);

  useEffect(() => {
    document.title = `Crecida del río ${base.rio} · ${base.nombre}`;
    conDatosOperativos(base).then((l) => {
      setLocalidad(l);
      if (ceroForzado === null) setCotaCero(l.hidrometro.cotaCero_m);
    });
    terrenoProcesado(base.id).then(setTerreno);
    obtenerNivel(base.id).then(setLectura);
    obtenerHistorico(base).then(setHistorico);
    cargarModelo(base.id)
      .then((m) => {
        setModelo(m);
        setEstadoModelo('listo');
      })
      .catch((e: Error) => setEstadoModelo(e.message));
    // La vista se monta de nuevo (key) por cada localidad: alcanza con correr esto al montar.
  }, [base, ceroForzado]);

  const actual = lectura?.altura_m ?? null;
  const altura = alturaSim ?? actual ?? localidad.umbrales[0]?.altura_m ?? 0;

  // Simulación de la subida: avanza la altura desde la actual hasta el máximo del simulador.
  useEffect(() => {
    if (!reproduciendo) return;
    const { max_m } = localidad.simulador;
    let previo = performance.now();
    let h = altura >= max_m - 0.01 ? (actual ?? localidad.simulador.min_m) : altura;
    let id = requestAnimationFrame(function paso(t) {
      h = Math.min(max_m, h + ((t - previo) / 1000) * 0.25); // 25 cm por segundo
      previo = t;
      setAlturaSim(Math.round(h * 100) / 100);
      if (h < max_m) id = requestAnimationFrame(paso);
      else setReproduciendo(false);
    });
    return () => cancelAnimationFrame(id);
    // Sólo arranca o frena con el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reproduciendo]);

  const cambiarVista = (v: Vista) => {
    setVista(v);
    const u = new URL(location.href);
    if (v === '3d') u.searchParams.set('vista', '3d');
    else u.searchParams.delete('vista');
    history.replaceState(null, '', u);
  };
  const cotaSim = altura + cotaCero;
  const cotaActual = actual === null ? null : actual + cotaCero;

  const hectareas = useMemo(() => {
    if (!modelo) return null;
    const f = (c: number) => superficieInundada(modelo.umbral, modelo.cauce, c, modelo.celda_m);
    return { sim: f(cotaSim), actual: cotaActual === null ? null : f(cotaActual) };
  }, [modelo, cotaSim, cotaActual]);

  return (
    <div className="app">
      <div className="aviso" role="note">
        <strong>Estimación.</strong> No reemplaza las indicaciones oficiales de Prefectura, el municipio y Defensa Civil.
      </div>
      <div className="selector-vista" role="tablist" aria-label="Tipo de vista">
        <button type="button" role="tab" aria-selected={vista === 'mapa'} onClick={() => cambiarVista('mapa')}>
          Mapa
        </button>
        <button type="button" role="tab" aria-selected={vista === '3d'} onClick={() => cambiarVista('3d')}>
          Vista 3D
        </button>
      </div>
      {vista === 'mapa' && terreno !== undefined && (
        <Mapa localidad={localidad} terreno={terreno} modelo={modelo} cotaSim={cotaSim} cotaActual={cotaActual} />
      )}
      {vista === '3d' &&
        (modelo ? (
          <Suspense fallback={<div className="cargando-3d">Cargando la vista 3D…</div>}>
            <Escena3D localidad={localidad} modelo={modelo} cotaSim={cotaSim} cotaActual={cotaActual} cotaCero={cotaCero} />
          </Suspense>
        ) : (
          <div className="cargando-3d">{estadoModelo === 'cargando' ? 'Calculando el modelo…' : estadoModelo}</div>
        ))}
      <Panel
        localidad={localidad}
        lectura={lectura}
        historico={historico}
        alturaSim={altura}
        onAlturaSim={(h) => {
          setReproduciendo(false);
          setAlturaSim(h);
        }}
        reproduciendo={reproduciendo}
        onReproducir={() => setReproduciendo(!reproduciendo)}
        conLeyenda={vista === 'mapa'}
        cotaCero={cotaCero}
        onCotaCero={setCotaCero}
        hectareas={hectareas}
        estadoModelo={estadoModelo}
        metaModelo={modelo?.meta ?? null}
        onLocalidad={onLocalidad}
      />
    </div>
  );
}
