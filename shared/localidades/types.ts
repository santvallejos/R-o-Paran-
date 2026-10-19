/**
 * Configuración de una localidad. Para sumar otra ciudad a lo largo del Paraná
 * alcanza con crear un archivo nuevo con este formato y registrarlo en `index.ts`.
 */
export type LonLat = [lon: number, lat: number];

export interface Umbral {
  nombre: string;
  altura_m: number;
  color: string;
}

export interface FuenteOficial {
  nombre: string;
  url: string;
}

export interface Localidad {
  /** Identificador en la URL: `?localidad=<id>`. */
  id: string;
  nombre: string;
  provincia: string;
  rio: string;

  /** Vista inicial del mapa. */
  centro: LonLat;
  zoom: number;
  /** Área de estudio [oeste, sur, este, norte]. El modelo se calcula sólo acá. */
  bbox: [number, number, number, number];
  /**
   * Puntos dentro del cauce principal. La inundación se propaga desde acá:
   * sólo se inunda lo que está conectado con estos puntos.
   */
  semillasRio: LonLat[];

  hidrometro: {
    nombre: string;
    /**
     * Cota del cero de la escala, en el mismo sistema de alturas que el DEM.
     * cota_agua = altura_hidrometro + cotaCero_m
     */
    cotaCero_m: number;
    /** `true` mientras el valor sea una estimación sin confirmar con INA/Prefectura. */
    cotaCeroProvisoria: boolean;
    /** Nombre del puerto tal como aparece en la tabla de alturas de Prefectura. */
    puertoPrefectura: string;
  };

  umbrales: Umbral[];
  /** Pronóstico oficial (rango) para mostrar en el simulador. */
  pronostico?: { desde_m: number; hasta_m: number; fuente: string };

  simulador: { min_m: number; max_m: number; paso_m: number };

  /** Series del INA (API a5) para el gráfico de los últimos días. */
  ina?: {
    /** Id de la serie de altura hidrométrica de la localidad. */
    serieAltura: number;
  };

  /** Máximos históricos de referencia, para probarlos en el simulador. */
  crecidasHistoricas?: { nombre: string; altura_m: number; fecha: string }[];

  /** Terreno usado por el modelo y por el relieve 3D. */
  dem: {
    nombre: string;
    tiles: string;
    encoding: 'terrarium' | 'mapbox';
    /** Zoom de tiles con el que se arma la grilla del modelo. */
    zoomModelo: number;
    maxzoom: number;
    attribution: string;
  };

  fuentes: FuenteOficial[];
}
