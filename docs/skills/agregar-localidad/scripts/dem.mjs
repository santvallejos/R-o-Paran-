// Relieve Terrarium (SRTM, pasada del 12/02/2000) sin dependencias: baja los tiles z14, los guarda en la
// carpeta temporal del sistema y decodifica el PNG con zlib. Sirve para ubicar semillas, ver bajos y barrancas
// y controlar el pelo de agua.
//
//   node dem.mjs punto <lon> <lat> [<lon> <lat> ...]
//   node dem.mjs grilla <oeste> <sur> <este> <norte> <paso_grados>
//   node dem.mjs ns <lon> <lat_norte> <lat_sur> <paso_grados>      (transecto norte-sur)
//   node dem.mjs eo <lat> <lon_oeste> <lon_este> <paso_grados>     (transecto oeste-este)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

export const Z = 14;
const URL_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const CACHE = join(tmpdir(), 'crecida-terrarium');

/** PNG RGB/RGBA de 8 bits a píxeles crudos (sólo lo que usan los tiles Terrarium). */
function decodificarPng(buf) {
  let p = 8;
  let ancho, alto, bits, tipo;
  const idat = [];
  while (p < buf.length) {
    const largo = buf.readUInt32BE(p);
    const nombre = buf.toString('ascii', p + 4, p + 8);
    const datos = buf.subarray(p + 8, p + 8 + largo);
    if (nombre === 'IHDR') [ancho, alto, bits, tipo] = [datos.readUInt32BE(0), datos.readUInt32BE(4), datos[8], datos[9]];
    else if (nombre === 'IDAT') idat.push(datos);
    else if (nombre === 'IEND') break;
    p += 12 + largo;
  }
  if (bits !== 8 || (tipo !== 2 && tipo !== 6)) throw new Error(`PNG no soportado (bits ${bits}, tipo ${tipo})`);
  const bpp = tipo === 6 ? 4 : 3;
  const crudo = inflateSync(Buffer.concat(idat));
  const fila = ancho * bpp;
  const out = Buffer.alloc(alto * fila);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (fila + 1)];
    for (let x = 0; x < fila; x++) {
      const a = x >= bpp ? out[y * fila + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * fila + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * fila + x - bpp] : 0;
      let v = crudo[y * (fila + 1) + 1 + x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * fila + x] = v & 255;
    }
  }
  return { ancho, bpp, datos: out };
}

const tiles = new Map();

/** Elevaciones (Float32Array 256×256, fila por fila desde el norte) del tile z14 (tx, ty). */
export async function tile(tx, ty) {
  const clave = `${tx}_${ty}`;
  if (!tiles.has(clave)) {
    tiles.set(clave, (async () => {
      mkdirSync(CACHE, { recursive: true });
      const archivo = join(CACHE, `${Z}_${clave}.png`);
      let buf;
      if (existsSync(archivo)) buf = readFileSync(archivo);
      else {
        const res = await fetch(URL_TILES.replace('{z}', Z).replace('{x}', tx).replace('{y}', ty));
        if (!res.ok) throw new Error(`Tile ${Z}/${tx}/${ty}: ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(archivo, buf);
      }
      const { ancho, bpp, datos } = decodificarPng(buf);
      const elev = new Float32Array(256 * 256);
      for (let i = 0; i < elev.length; i++) {
        const j = (Math.floor(i / 256) * ancho + (i % 256)) * bpp;
        elev[i] = datos[j] * 256 + datos[j + 1] + datos[j + 2] / 256 - 32768;
      }
      return elev;
    })());
  }
  return tiles.get(clave);
}

/** Píxel global (x, y) a zoom 14 de un punto lon/lat. */
export function aPixel(lon, lat) {
  const n = 256 * 2 ** Z;
  const r = (lat * Math.PI) / 180;
  return [((lon + 180) / 360) * n, ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * n];
}

/** Elevación (m) del píxel que contiene a lon/lat. */
export async function elev(lon, lat) {
  const [x, y] = aPixel(lon, lat).map(Math.floor);
  const t = await tile(Math.floor(x / 256), Math.floor(y / 256));
  return t[(y % 256) * 256 + (x % 256)];
}

const pasos = (desde, hasta, paso) => {
  const out = [];
  const n = Math.round(Math.abs(hasta - desde) / paso);
  for (let i = 0; i <= n; i++) out.push(desde + Math.sign(hasta - desde) * i * paso);
  return out;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [modo, ...resto] = process.argv.slice(2);
  const v = resto.map(Number);
  const m = (h) => h.toFixed(1).padStart(7);
  if (modo === 'punto') {
    for (let i = 0; i + 1 < v.length; i += 2) console.log(`${v[i]}, ${v[i + 1]}: ${(await elev(v[i], v[i + 1])).toFixed(1)} m`);
  } else if (modo === 'grilla') {
    const [o, s, e, n, paso] = v;
    const lons = pasos(o, e, paso);
    console.log('lat \\ lon'.padEnd(10) + lons.map((l) => l.toFixed(4).padStart(9)).join(''));
    for (const lat of pasos(n, s, paso)) {
      const fila = await Promise.all(lons.map((lon) => elev(lon, lat)));
      console.log(lat.toFixed(4).padEnd(10) + fila.map((h) => m(h).padStart(9)).join(''));
    }
  } else if (modo === 'ns') {
    const [lon, n, s, paso] = v;
    for (const lat of pasos(n, s, paso)) console.log(`${lat.toFixed(4)} ${m(await elev(lon, lat))}`);
  } else if (modo === 'eo') {
    const [lat, o, e, paso] = v;
    for (const lon of pasos(o, e, paso)) console.log(`${lon.toFixed(4)} ${m(await elev(lon, lat))}`);
  } else {
    console.error('Uso: node dem.mjs punto|grilla|ns|eo ... (ver el encabezado del archivo)');
    process.exit(1);
  }
}
