// Textos que exigen las licencias de los datos. Van literales: no traducir ni resumir.

/** Licencia Copernicus WorldDEM-30, art. 6(b): aviso obligatorio para datos modificados. */
export const AVISO_COPERNICUS_DEM =
  'produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved';

/** Licencia Copernicus WorldDEM-30, art. 6(c): deslinde de responsabilidad (se permite traducido). */
export const DESLINDE_COPERNICUS =
  'Las organizaciones a cargo del programa Copernicus, por ley o por delegación, no asumen ninguna responsabilidad por el uso del Copernicus WorldDEM-30.';

/** ESA WorldCover (CC BY 4.0): texto pedido al usarlo como capa de un mapa publicado. */
export const AVISO_WORLDCOVER =
  '© ESA WorldCover project / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium';

/** Edificios de Overture Maps: ODbL, derivados de OpenStreetMap, Microsoft, Esri Community Maps y Google Open Buildings. */
export const AVISO_EDIFICIOS =
  'Edificios: Overture Maps, © OpenStreetMap contributors, Microsoft, Esri Community Maps contributors, Google Open Buildings (ODbL)';

/** Atribución del relieve procesado: el DEM de origen más la corrección por cobertura. */
export function atribucionRelieve(fuenteDem: string): string {
  const dem = /copernicus/i.test(fuenteDem) ? `Relieve ${AVISO_COPERNICUS_DEM}` : `Relieve: ${fuenteDem}`;
  return `${dem} | ${AVISO_WORLDCOVER}`;
}
