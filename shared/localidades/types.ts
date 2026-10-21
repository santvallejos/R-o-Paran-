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
  /** Id de la región (`regiones.json`) con la que se agrupa en el selector y en el mapa regional. */
  region: string;
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
    /** Texto que explica cómo se obtuvo la cota del cero (se muestra en el panel). */
    notaCalibracion?: string;
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

  /**
   * Parámetros del pipeline de relieve (procesamiento/procesar.py). La app no los usa
   * para calcular; están tipados para validarlos junto con el resto de la configuración.
   */
  procesamiento?: {
    /** Fuente del DEM base (p. ej. `copernicus-glo30`). */
    fuente: string;
    /** Margen alrededor del bbox, en grados, para los tiles de relieve 3D. */
    margenTiles_grados: number;
    /** Rango de zoom [mínimo, máximo] de los tiles de relieve generados. */
    zoomTiles: [min: number, max: number];
    /** Metros que se restan al DEM según la cobertura (ESA WorldCover). */
    correccionCobertura_m: { arboles: number; arbustos: number; edificado: number };
    /** Tamaño de la ventana del filtro de mediana contra el ruido del DEM. */
    filtroMediana_px: number;
    /** Alturas del hidrómetro para las que se precalculan zonas inundables. */
    nivelesZonas_m: { desde: number; hasta: number; paso: number };
    /** Tolerancia de simplificación de los polígonos de zonas, en metros. */
    simplificarZonas_m: number;
    /** Densidad y tope de árboles de la vista 3D. */
    escena3d: { densidadArboles: number; maxArboles: number };
  };

  fuentes: FuenteOficial[];
}
