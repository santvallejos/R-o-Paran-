import * as maplibregl from 'maplibre-gl';
import type { ImageSource, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import urlWorkerMapa from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect, useRef, useState } from 'react';
import type { Localidad } from '../../shared/localidades';
import { pintarCapa } from '../lib/capa';
import type { TerrenoProcesado } from '../lib/localidad';
import type { Modelo } from '../lib/modelo';

// El bundler no sigue el worker interno de MapLibre: se le indica la URL explícita.
maplibregl.setWorkerUrl(urlWorkerMapa);

type Base = 'satelite' | 'calles';

interface Props {
  localidad: Localidad;
  /** Relieve procesado de la localidad; `null` = usar el DEM público de la configuración. */
  terreno: TerrenoProcesado | null;
  modelo: Modelo | null;
  cotaSim: number;
  cotaActual: number | null;
}

function estilo(loc: Localidad, t: TerrenoProcesado | null): StyleSpecification {
  const dem = t
    ? { tiles: [t.tiles], encoding: t.encoding, minzoom: t.minzoom, maxzoom: t.maxzoom, bounds: t.bounds, attribution: `Relieve: ${t.fuente} (procesado), ESA WorldCover` }
    : { tiles: [loc.dem.tiles], encoding: loc.dem.encoding, maxzoom: loc.dem.maxzoom, attribution: loc.dem.attribution };
  return {
    version: 8,
    sources: {
      satelite: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
      },
      calles: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
      terreno: { type: 'raster-dem', tileSize: 256, ...dem },
      // MapLibre recomienda una fuente aparte para el sombreado.
      sombreado: { type: 'raster-dem', tileSize: 256, ...dem, attribution: undefined },
    },
    layers: [
      { id: 'satelite', type: 'raster', source: 'satelite' },
      { id: 'calles', type: 'raster', source: 'calles', layout: { visibility: 'none' } },
      {
        id: 'sombreado',
        type: 'hillshade',
        source: 'sombreado',
        paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#1e293b' },
      },
    ],
    terrain: { source: 'terreno', exaggeration: 4 },
  };
}

export function Mapa({ localidad, terreno, modelo, cotaSim, cotaActual }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const buffer = useRef<ImageData | null>(null);
  const [listo, setListo] = useState(false);
  const [base, setBase] = useState<Base>('satelite');
  const [tresD, setTresD] = useState(true);

  useEffect(() => {
    const m = new maplibregl.Map({
      container: contenedor.current!,
      style: estilo(localidad, terreno),
      center: localidad.centro,
      zoom: localidad.zoom,
      // Con relieve procesado, la navegación queda dentro del área que cubre.
      ...(terreno && { maxBounds: terreno.bounds, minZoom: terreno.minzoom }),
      pitch: 55,
      bearing: -20,
      maxPitch: 75,
      attributionControl: { compact: true },
    });
    // En el celular el panel tapa la mitad inferior: centrar en la parte visible.
    m.setPadding(window.innerWidth < 820 ? { top: 40, bottom: window.innerHeight * 0.4, left: 0, right: 0 } : { top: 40, bottom: 0, left: 0, right: 420 });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');
    m.on('load', () => setListo(true));
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      setListo(false);
    };
    // Sólo se recrea el mapa si cambia la localidad o su relieve, no por datos operativos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localidad.id, terreno]);

  // Capa de agua: se crea una vez y se actualiza la imagen en cada cambio de cota.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo || !modelo) return;
    const frame = requestAnimationFrame(() => {
      buffer.current = pintarCapa(modelo, cotaSim, cotaActual, buffer.current ?? undefined);
      const fuente = m.getSource<ImageSource>('agua');
      if (fuente) {
        fuente.updateImage({ image: buffer.current });
      } else {
        m.addSource('agua', {
          type: 'image',
          coordinates: modelo.esquinas as [[number, number], [number, number], [number, number], [number, number]],
        });
        m.getSource<ImageSource>('agua')!.updateImage({ image: buffer.current });
        m.addLayer({ id: 'agua', type: 'raster', source: 'agua', paint: { 'raster-resampling': 'nearest', 'raster-fade-duration': 0 } });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [listo, modelo, cotaSim, cotaActual]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;
    m.setLayoutProperty('satelite', 'visibility', base === 'satelite' ? 'visible' : 'none');
    m.setLayoutProperty('calles', 'visibility', base === 'calles' ? 'visible' : 'none');
  }, [base, listo]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;
    m.setTerrain(tresD ? { source: 'terreno', exaggeration: 4 } : null);
    m.easeTo({ pitch: tresD ? 55 : 0, bearing: tresD ? -20 : 0, duration: 600 });
  }, [tresD, listo]);

  return (
    <div className="mapa">
      <div ref={contenedor} className="mapa__lienzo" />
      <div className="mapa__controles">
        <button type="button" onClick={() => setBase(base === 'satelite' ? 'calles' : 'satelite')}>
          {base === 'satelite' ? 'Ver calles' : 'Ver satélite'}
        </button>
        <button type="button" onClick={() => setTresD(!tresD)} aria-pressed={tresD}>
          {tresD ? 'Vista 2D' : 'Vista 3D'}
        </button>
      </div>
    </div>
  );
}
