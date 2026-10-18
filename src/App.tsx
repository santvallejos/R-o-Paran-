import { useEffect, useMemo, useState } from 'react';
import type { LecturaNivel } from '../shared/fuentes/nivel';
import { getLocalidad, localidades, type Localidad } from '../shared/localidades';
import { Mapa } from './components/Mapa';
import { Panel } from './components/Panel';
import { superficieInundada } from './lib/inundacion';
import { conDatosOperativos, terrenoProcesado, type TerrenoProcesado } from './lib/localidad';
import { cargarModelo, type Modelo } from './lib/modelo';
import { obtenerNivel } from './lib/nivel';

const params = new URLSearchParams(location.search);

const ceroUrl = Number(params.get('cero'));
const ceroForzado = params.has('cero') && Number.isFinite(ceroUrl) && ceroUrl > 0 ? ceroUrl : null;

export function App() {
  const base = getLocalidad(params.get('localidad'));
  const [localidad, setLocalidad] = useState<Localidad | undefined>(base);
  const [terreno, setTerreno] = useState<TerrenoProcesado | null | undefined>(undefined);
  const [lectura, setLectura] = useState<LecturaNivel | null | undefined>(undefined);
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [estadoModelo, setEstadoModelo] = useState('cargando');
  const [alturaSim, setAlturaSim] = useState<number | null>(null);
  const [cotaCero, setCotaCero] = useState(ceroForzado ?? base?.hidrometro.cotaCero_m ?? 0);

  useEffect(() => {
    if (!base) return;
    document.title = `Crecida del río ${base.rio} · ${base.nombre}`;
    conDatosOperativos(base).then((l) => {
      setLocalidad(l);
      if (ceroForzado === null) setCotaCero(l.hidrometro.cotaCero_m);
    });
    terrenoProcesado(base.id).then(setTerreno);
    obtenerNivel(base.id).then(setLectura);
    cargarModelo(base.id)
      .then((m) => {
        setModelo(m);
        setEstadoModelo('listo');
      })
      .catch((e: Error) => setEstadoModelo(e.message));
  }, [base]);

  const actual = lectura?.altura_m ?? null;
  const altura = alturaSim ?? actual ?? localidad?.umbrales[0]?.altura_m ?? 0;
  const cotaSim = altura + cotaCero;
  const cotaActual = actual === null ? null : actual + cotaCero;

  const hectareas = useMemo(() => {
    if (!modelo) return null;
    const f = (c: number) => superficieInundada(modelo.umbral, modelo.cauce, c, modelo.celda_m);
    return { sim: f(cotaSim), actual: cotaActual === null ? null : f(cotaActual) };
  }, [modelo, cotaSim, cotaActual]);

  if (!localidad) {
    return (
      <main className="vacio">
        <p>Localidad no encontrada. Disponibles:</p>
        <ul>
          {Object.values(localidades).map((l) => (
            <li key={l.id}>
              <a href={`?localidad=${l.id}`}>{l.nombre}</a>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <div className="app">
      <div className="aviso" role="note">
        <strong>Estimación.</strong> No reemplaza las indicaciones oficiales de Prefectura, el municipio y Defensa Civil.
      </div>
      {terreno !== undefined && <Mapa localidad={localidad} terreno={terreno} modelo={modelo} cotaSim={cotaSim} cotaActual={cotaActual} />}
      <Panel
        localidad={localidad}
        lectura={lectura}
        alturaSim={altura}
        onAlturaSim={setAlturaSim}
        cotaCero={cotaCero}
        onCotaCero={setCotaCero}
        hectareas={hectareas}
        estadoModelo={estadoModelo}
        metaModelo={modelo?.meta ?? null}
      />
    </div>
  );
}
