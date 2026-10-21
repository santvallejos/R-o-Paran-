import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localidad } from '../../shared/localidades';
import { AVISO_COPERNICUS_DEM, AVISO_EDIFICIOS, AVISO_WORLDCOVER } from '../lib/creditos';
import { lonLatAPixel } from '../lib/geo';
import type { Modelo } from '../lib/modelo';
import { cargarDatosEscena, type DatosEscena, type Edificio } from './datos';
import { EXAG, EscenaCrecida } from './escena';
import './escena3d.css';

interface Props {
  localidad: Localidad;
  modelo: Modelo;
  cotaSim: number;
  cotaActual: number | null;
  cotaCero: number;
}

const m = (h: number) => `${h.toFixed(2).replace('.', ',')} m`;

export default function Escena3D({ localidad, modelo, cotaSim, cotaActual, cotaCero }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const escena = useRef<EscenaCrecida | null>(null);
  const [datos, setDatos] = useState<DatosEscena | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<{ indice: number; edificio: Edificio } | null>(null);

  useEffect(() => {
    cargarDatosEscena(localidad.id, modelo.ancho * modelo.alto).then(setDatos, (e: Error) => setError(e.message));
  }, [localidad.id, modelo]);

  // Metros locales de la grilla del modelo para un punto lon/lat.
  const local = useMemo(() => {
    const z = localidad.dem.zoomModelo;
    const [x0, y0] = lonLatAPixel(modelo.esquinas[0][0], modelo.esquinas[0][1], z);
    return (lon: number, lat: number): [number, number] => {
      const [x, y] = lonLatAPixel(lon, lat, z);
      return [(x - x0) * modelo.celda_m, (y - y0) * modelo.celda_m];
    };
  }, [localidad, modelo]);

  useEffect(() => {
    if (!datos || !contenedor.current) return;
    if (!document.createElement('canvas').getContext('webgl2')) {
      setError('Este dispositivo no soporta WebGL 2, necesario para la vista 3D.');
      return;
    }
    const centro = local(...localidad.centro);
    const rio = local(...localidad.semillasRio[0]);
    const e = new EscenaCrecida(contenedor.current, modelo, datos, {
      centro,
      // En el celular el panel tapa la mitad de abajo: la escena se centra más arriba.
      desplazamiento: innerWidth < 820 ? 0.22 : 0,
      etiquetas: [
        { texto: localidad.nombre, x: centro[0], z: centro[1] },
        { texto: `Río ${localidad.rio}`, x: rio[0], z: rio[1] },
      ],
      onSeleccion: setSel,
    });
    escena.current = e;
    return () => {
      e.dispose();
      escena.current = null;
    };
    // La escena se reconstruye sólo si cambian los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos]);

  useEffect(() => {
    escena.current?.setNivel(cotaSim, cotaActual);
  }, [cotaSim, cotaActual, datos]);

  const conteo = useMemo(() => {
    if (!datos) return null;
    let sim = 0;
    let hoy = 0;
    for (const e of datos.edificios) {
      if (e.cotaAgua === null) continue;
      if (e.cotaAgua <= cotaSim) sim++;
      if (cotaActual !== null && e.cotaAgua <= cotaActual) hoy++;
    }
    return { sim, hoy, total: datos.edificios.length };
  }, [datos, cotaSim, cotaActual]);

  // Créditos según lo que realmente se muestra: el relieve del modelo y, sólo si se
  // cargaron, la cobertura (WorldCover, también da los árboles) y los edificios (Overture).
  const creditos = useMemo(() => {
    const { fuenteDem, precalculado } = modelo.meta;
    // Sin relieve procesado vale la atribución de la configuración.
    const copernicus = /copernicus/i.test(fuenteDem);
    const relieve = precalculado ? (copernicus ? `Relieve ${AVISO_COPERNICUS_DEM}` : `Relieve: ${fuenteDem}`) : localidad.dem.attribution;
    const relieveCorto = precalculado ? (copernicus ? '© Copernicus DEM' : fuenteDem) : localidad.dem.attribution;
    const conCobertura = !!datos && (datos.cobertura.some((v) => v !== 0) || datos.arboles.x.length > 0);
    const conEdificios = !!datos && datos.edificios.length > 0;
    const largo = [relieve];
    const corto = [relieveCorto];
    if (conCobertura) {
      largo.push(`Cobertura ${AVISO_WORLDCOVER}`);
      corto.push('ESA WorldCover');
    }
    if (conEdificios) {
      largo.push(AVISO_EDIFICIOS);
      corto.push('Overture Maps / OpenStreetMap');
    }
    largo.push(`Exageración vertical ×${EXAG}`);
    corto.push(`Vertical ×${EXAG}`);
    return { largo: largo.join(' · '), corto: corto.join(' · ') };
  }, [modelo.meta, localidad.dem.attribution, datos]);

  return (
    <div className="escena3d" ref={contenedor}>
      {!datos && !error && <div className="escena3d__estado">Armando la vista 3D…</div>}
      {error && <div className="escena3d__estado">{error}</div>}

      <div className="escena3d__tarjetas">
      {conteo && (
        <div className="escena3d__resumen">
          <strong>{conteo.sim.toLocaleString('es-AR')}</strong> de {conteo.total.toLocaleString('es-AR')} edificios con agua a {m(cotaSim - cotaCero)}
          {cotaActual !== null && cotaSim > cotaActual && <span> · {(conteo.sim - conteo.hoy).toLocaleString('es-AR')} más que hoy</span>}
          <small>Estimación. Tocá un edificio para ver a qué altura le llega el agua.</small>
        </div>
      )}

      {sel && (
        <div className="escena3d__ficha" role="status">
          <button type="button" aria-label="Cerrar" onClick={() => (escena.current?.seleccionar(null), setSel(null))}>
            ×
          </button>
          {sel.edificio.cotaAgua === null ? (
            <p>Según el modelo, a este edificio no le llega el agua del río en ningún nivel simulado.</p>
          ) : (
            <p>
              Según el modelo, el agua llega a este edificio cuando el río marca <strong>{m(sel.edificio.cotaAgua - cotaCero)}</strong>
              {cotaActual !== null && sel.edificio.cotaAgua <= cotaActual
                ? ' (ya con la altura de hoy).'
                : sel.edificio.cotaAgua - cotaCero > localidad.simulador.max_m
                  ? ', muy por encima de esta crecida.'
                  : '.'}
            </p>
          )}
          <small>Estimación con relieve de ~30 m: puede errar en ±1 m o más. Seguí las indicaciones oficiales.</small>
        </div>
      )}
      </div>

      <ul className="escena3d__leyenda">
        <li><i style={{ background: '#5d9fb3' }} /> Agua conectada al río</li>
        {cotaActual !== null && <li><i style={{ background: '#c98b6c' }} /> Agua que se suma respecto de hoy</li>}
        {cotaActual !== null && <li><i style={{ background: '#9e1c1c' }} /> Edificio con agua hoy</li>}
        <li><i style={{ background: '#ed6630' }} /> Edificio con agua a la altura simulada</li>
        <li><i style={{ background: '#eee8df', outline: '1px solid #bbb' }} /> Edificio seco</li>
      </ul>

      <div className="escena3d__creditos">
        <span className="escena3d__creditos-largo">{creditos.largo}</span>
        <span className="escena3d__creditos-corto">{creditos.corto}</span>
      </div>
    </div>
  );
}
