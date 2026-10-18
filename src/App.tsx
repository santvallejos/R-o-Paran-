import { useEffect, useMemo, useState } from 'react';
import type { LecturaNivel } from '../shared/fuentes/nivel';
import { getLocalidad, localidades } from '../shared/localidades';
import { Mapa } from './components/Mapa';
import { Panel } from './components/Panel';
import { superficieInundada } from './lib/inundacion';
import { cargarModelo, type Modelo } from './lib/modelo';
import { obtenerNivel } from './lib/nivel';

const params = new URLSearchParams(location.search);

export function App() {
  const localidad = getLocalidad(params.get('localidad'));
  const [lectura, setLectura] = useState<LecturaNivel | null | undefined>(undefined);
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [estadoModelo, setEstadoModelo] = useState('cargando');
  const [alturaSim, setAlturaSim] = useState<number | null>(null);
  const ceroUrl = Number(params.get('cero'));
  const [cotaCero, setCotaCero] = useState(Number.isFinite(ceroUrl) && ceroUrl > 0 ? ceroUrl : (localidad?.hidrometro.cotaCero_m ?? 0));

  useEffect(() => {
    if (!localidad) return;
    document.title = `Crecida del río ${localidad.rio} · ${localidad.nombre}`;
    obtenerNivel(localidad.id).then(setLectura);
    cargarModelo(localidad.id)
      .then((m) => {
        setModelo(m);
        setEstadoModelo('listo');
      })
      .catch((e: Error) => setEstadoModelo(e.message));
  }, [localidad]);

  const actual = lectura?.altura_m ?? null;
  const altura = alturaSim ?? actual ?? localidad?.umbrales[0]?.altura_m ?? 0;
  const cotaSim = altura + cotaCero;
  const cotaActual = actual === null ? null : actual + cotaCero;

  const hectareas = useMemo(() => {
    if (!modelo) return null;
    const f = (c: number) => superficieInundada(modelo.umbral, modelo.elev, c, modelo.cotaCauce, modelo.celda_m);
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
      <Mapa localidad={localidad} modelo={modelo} cotaSim={cotaSim} cotaActual={cotaActual} />
      <Panel
        localidad={localidad}
        lectura={lectura}
        alturaSim={altura}
        onAlturaSim={setAlturaSim}
        cotaCero={cotaCero}
        onCotaCero={setCotaCero}
        hectareas={hectareas}
        estadoModelo={estadoModelo}
      />
    </div>
  );
}
