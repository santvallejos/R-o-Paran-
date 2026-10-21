import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './campana.json' with { type: 'json' };

// Campana (Buenos Aires), sobre el Paraná de las Palmas (Bajo Paraná / Delta). Datos relevados
// el 21/10/2026; fuentes de cada valor en la ficha de la localidad.
//
// - hidrometro.cotaCero_m (0,418 m): cero de la escala respecto del cero IGN (Mar del Plata),
//   nivelado por IGN e INA en diciembre de 2016 desde el bulón BUHB (3,875 m) del puerto (INA,
//   informe LHA 02-373-18). El pelo de agua del Copernicus no sirve de control (el río está
//   aplanado en 0,00 m); en BUHB y PF5N(131) del IGN el DEM corregido queda ~0,2 m por debajo.
//   No se pasa a EGM2008: con el geoide de cada bulón, Zárate quedaría por debajo de Campana.
// - bbox y semillasRio: calles y ríos de OSM (Overpass) y transectos del DEM. Las semillas caen en
//   el cauce del Paraná de las Palmas (−0,3 a −1,1 m en el SRTM), frente al puerto, frente a
//   Siderca y en la curva aguas arriba. El casco está sobre la barranca (10–25 m); lo inundable es
//   la franja costera, los bajos del arroyo La Cruz (San Cayetano) y las islas de enfrente.
// - umbrales (Alerta 2,20 / Evacuación 2,45): tabla de Prefectura (iguales en el INA); la Edge
//   Function registrar-nivel los mantiene al día.
// - crecidasHistoricas: máximos de la serie 41 del INA. Los picos de 2000 y 2023 son sudestadas
//   (un día); los de 1983, 1998 y 2016, crecidas del río sostenidas.
export const campana = datos as unknown as Localidad;
