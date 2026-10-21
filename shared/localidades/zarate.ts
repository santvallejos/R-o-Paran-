import type { Localidad } from './types.js';
// `with { type: 'json' }`: la API de Vercel corre como ESM de Node sin empaquetar.
import datos from './zarate.json' with { type: 'json' };

// Zárate (Buenos Aires), sobre el Paraná de las Palmas (Bajo Paraná / Delta), ~9 km aguas arriba
// de Campana. Datos relevados el 21/10/2026; fuentes de cada valor en la ficha de la localidad.
//
// - hidrometro.cotaCero_m (0,243 m): cero de la escala respecto del cero IGN (Mar del Plata),
//   nivelado por IGN e INA en diciembre de 2016 desde el bulón BUHC (3,463 m) de Prefectura (INA,
//   informe LHA 02-373-18). Es coherente con el de Campana (0,418 m): con lecturas simultáneas
//   (INA 2010–2026 y Prefectura del último año) el agua en Zárate queda en mediana 0,03–0,18 m por
//   encima, según el período. El pelo de agua del Copernicus no sirve de control (río aplanado en
//   0,00 m) y no hay punto del IGN en tierra firme cerca del puerto que lo reemplace.
// - bbox y semillasRio: calles y ríos de OSM (Overpass) y transectos del DEM. Las semillas caen en
//   el cauce del Paraná de las Palmas (−0,7 y −1,0 m en el SRTM), aguas arriba y abajo del puerto.
//   El casco está sobre la barranca (25–28 m); lo inundable es la franja portuaria, la costanera
//   baja, los bajos del noroeste y las islas de enfrente.
// - umbrales (Alerta 2,20 / Evacuación 2,40): tabla de Prefectura, los que cita la prensa local (el
//   INA tiene 2,0 / 2,2); la Edge Function registrar-nivel los mantiene al día con los oficiales.
// - crecidasHistoricas: máximos de la serie 40 del INA (sin datos de la sudestada de 2000), más dos
//   sudestadas con efecto conocido: 25/03/2016 (2,40 m en el INA; bombeo en Villa Angus, sin
//   desborde) y 12/02/2019 (2,35 m según La Voz de Zárate; el INA guarda 2,20 a las 07Z; desbordó
//   el borde del Paseo de la Ribera).
export const zarate = datos as unknown as Localidad;
