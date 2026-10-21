// Vista previa del modelo de una localidad antes de procesar el relieve: arma la grilla Terrarium del bbox como
// src/lib/terreno.ts (cargarGrilla), corre el Priority-Flood real de src/lib/inundacion.ts desde las semillas y
// muestra hectáreas y alcance del agua por altura. Es el mismo cálculo que hace la app cuando la localidad no
// tiene relieve procesado; con el relieve corregido de procesar.py los números cambian.
//
// Desde la raíz del repo (Node 23.6+, importa los .ts sin compilar):
//   node <skill>/scripts/vista-previa.mjs <id> [altura_m ...]
// Sin alturas usa los umbrales, las crecidas históricas, el máximo del simulador y el respaldo de nivel.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Z, aPixel, tile } from './dem.mjs';

const [id, ...args] = process.argv.slice(2);
if (!id) {
  console.error('Uso: node vista-previa.mjs <id> [altura_m ...]   (desde la raíz del repo)');
  process.exit(1);
}
const raiz = process.cwd();
const importar = (ruta) => import(pathToFileURL(join(raiz, ruta)).href);
const { calcularUmbrales, superficieInundada } = await importar('src/lib/inundacion.ts');
const { pixelALonLat, metrosPorPixel } = await importar('src/lib/geo.ts');
const loc = JSON.parse(readFileSync(join(raiz, 'shared/localidades', `${id}.json`), 'utf8'));
const cero = loc.hidrometro.cotaCero_m;
if (loc.dem.zoomModelo !== Z) console.warn(`Aviso: la localidad usa zoomModelo ${loc.dem.zoomModelo}; la vista previa usa z${Z}.`);

// Grilla alineada a píxeles z14, igual que cargarGrilla.
const [oeste, sur, este, norte] = loc.bbox;
const [x0, y0] = aPixel(oeste, norte).map(Math.floor);
const [x1, y1] = aPixel(este, sur).map(Math.ceil);
const ancho = x1 - x0, alto = y1 - y0;
const elev = new Float32Array(ancho * alto);
const pedidos = [];
for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y1 - 1) / 256); ty++)
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x1 - 1) / 256); tx++)
    pedidos.push(tile(tx, ty).then((t) => {
      for (let py = 0; py < 256; py++) {
        const gy = ty * 256 + py - y0;
        if (gy < 0 || gy >= alto) continue;
        for (let px = 0; px < 256; px++) {
          const gx = tx * 256 + px - x0;
          if (gx >= 0 && gx < ancho) elev[gy * ancho + gx] = t[py * 256 + px];
        }
      }
    }));
await Promise.all(pedidos);
const celda = metrosPorPixel((norte + sur) / 2, Z);
const indice = ([lon, lat]) => {
  const [x, y] = aPixel(lon, lat).map(Math.floor);
  return x >= x0 && x < x1 && y >= y0 && y < y1 ? (y - y0) * ancho + (x - x0) : -1;
};

console.log(`${loc.nombre} (${id}): grilla ${ancho}×${alto} (${((ancho * alto) / 1e6).toFixed(2)} M celdas, ${celda.toFixed(1)} m), cero ${cero} m`);
const semillas = loc.semillasRio.map(indice);
semillas.forEach((i, k) => console.log(`  semilla ${k} [${loc.semillasRio[k]}]: ${i < 0 ? 'FUERA DE LA GRILLA' : `${elev[i].toFixed(1)} m`}`));
const validas = semillas.filter((i) => i >= 0);
if (!validas.length) process.exit(1);
const cotas = validas.map((i) => elev[i]);
const pelo = Math.min(...cotas);
console.log(`  pelo de agua del DEM (SRTM, 12/02/2000): ${pelo.toFixed(1)} m ≈ ${(pelo - cero).toFixed(2)} m en el hidrómetro`);
if (Math.max(...cotas) - pelo > 1) console.log('  AVISO: las semillas difieren en más de 1 m; alguna puede estar sobre tierra o vegetación.');

const umbral = calcularUmbrales(elev, ancho, alto, validas);
// Mismo agua permanente que el respaldo del worker: hasta la semilla más alta + 0,5 m.
const cauce = Uint8Array.from(elev, (e) => (e <= Math.max(...cotas) + 0.5 ? 1 : 0));
const c = indice(loc.centro);
if (c >= 0) {
  const u = umbral[c];
  console.log(`  centro: terreno ${elev[c].toFixed(1)} m; ${Number.isFinite(u) ? `se inunda desde ${u.toFixed(1)} m (${(u - cero).toFixed(2)} m en el hidrómetro)` : 'no se conecta con el río'}`);
}

let alturas = args.map(Number).filter(Number.isFinite).map((h) => [h, '']);
if (!alturas.length) {
  alturas = [
    ...loc.umbrales.map((u) => [u.altura_m, u.nombre]),
    ...(loc.crecidasHistoricas ?? []).map((h) => [h.altura_m, `crecida ${h.nombre}`]),
    [loc.simulador.max_m, 'máximo del simulador'],
  ];
  const respaldo = join(raiz, 'public/data/nivel', `${id}.json`);
  if (existsSync(respaldo)) {
    const l = JSON.parse(readFileSync(respaldo, 'utf8'));
    if (l.altura_m != null) alturas.push([l.altura_m, `lectura ${l.fecha ?? ''}`.trim()]);
  }
  alturas.sort((a, b) => a[0] - b[0]);
}
for (const [h, nombre] of alturas) {
  const cota = h + cero;
  let [cmin, cmax, fmin, fmax] = [Infinity, -1, Infinity, -1];
  for (let i = 0; i < umbral.length; i++) {
    if (cauce[i] || umbral[i] > cota) continue;
    const f = Math.floor(i / ancho), col = i % ancho;
    if (col < cmin) cmin = col;
    if (col > cmax) cmax = col;
    if (f < fmin) fmin = f;
    if (f > fmax) fmax = f;
  }
  const ha = superficieInundada(umbral, cauce, cota, celda);
  const alcance = cmax < 0 ? 'sin agua fuera del cauce' : (() => {
    const [o, n] = pixelALonLat(x0 + cmin, y0 + fmin, Z);
    const [e, s] = pixelALonLat(x0 + cmax + 1, y0 + fmax + 1, Z);
    return `agua en [${o.toFixed(3)}, ${s.toFixed(3)}, ${e.toFixed(3)}, ${n.toFixed(3)}]`;
  })();
  console.log(`  ${h.toFixed(2)} m${nombre ? ` (${nombre})` : ''} → cota ${cota.toFixed(2)} m: ${Math.round(ha)} ha; ${alcance}`);
}
