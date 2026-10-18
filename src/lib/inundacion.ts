/**
 * Modelo de inundación tipo "bañera" con conectividad hidráulica.
 *
 * En lugar de calcular una máscara por cada altura, se calcula una sola vez, para
 * cada celda, la cota mínima del agua a la que esa celda queda conectada con el río
 * (camino minimax desde las semillas, variante de Priority-Flood). Después, para
 * cualquier cota W:   inundada(celda) ⇔ umbral[celda] <= W
 * Eso permite que el control deslizante responda al instante en el celular.
 */
export function calcularUmbrales(elev: Float32Array, ancho: number, alto: number, semillas: number[]): Float32Array {
  const n = ancho * alto;
  const umbral = new Float32Array(n).fill(Infinity);
  const heap = new MinHeap(n);

  for (const s of semillas) {
    if (elev[s] < umbral[s]) {
      umbral[s] = elev[s];
      heap.push(s, elev[s]);
    }
  }

  while (heap.size > 0) {
    const costo = heap.peekKey();
    const i = heap.pop();
    if (costo > umbral[i]) continue; // entrada vieja
    const x = i % ancho;
    // 4-vecinos: más conservador que 8, evita que el agua "se filtre" por diagonales.
    if (x > 0) relajar(i - 1, costo);
    if (x < ancho - 1) relajar(i + 1, costo);
    if (i >= ancho) relajar(i - ancho, costo);
    if (i < n - ancho) relajar(i + ancho, costo);
  }
  return umbral;

  function relajar(j: number, costo: number) {
    const c = elev[j] > costo ? elev[j] : costo;
    if (c < umbral[j]) {
      umbral[j] = c;
      heap.push(j, c);
    }
  }
}

/** Heap binario mínimo sobre arrays tipados (admite entradas repetidas). */
class MinHeap {
  private ids: Int32Array;
  private keys: Float32Array;
  size = 0;

  constructor(capacidad: number) {
    this.ids = new Int32Array(Math.max(16, capacidad));
    this.keys = new Float32Array(Math.max(16, capacidad));
  }

  push(id: number, key: number) {
    if (this.size === this.ids.length) this.crecer();
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= key) break;
      this.ids[i] = this.ids[p];
      this.keys[i] = this.keys[p];
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }

  peekKey() {
    return this.keys[0];
  }

  pop(): number {
    const top = this.ids[0];
    const ultimoId = this.ids[--this.size];
    const ultimaKey = this.keys[this.size];
    let i = 0;
    for (;;) {
      let h = 2 * i + 1;
      if (h >= this.size) break;
      if (h + 1 < this.size && this.keys[h + 1] < this.keys[h]) h++;
      if (this.keys[h] >= ultimaKey) break;
      this.ids[i] = this.ids[h];
      this.keys[i] = this.keys[h];
      i = h;
    }
    this.ids[i] = ultimoId;
    this.keys[i] = ultimaKey;
    return top;
  }

  private crecer() {
    const ids = new Int32Array(this.ids.length * 2);
    const keys = new Float32Array(this.keys.length * 2);
    ids.set(this.ids);
    keys.set(this.keys);
    this.ids = ids;
    this.keys = keys;
  }
}

/** Superficie (ha) inundada a la cota `cota`, sin contar el agua permanente (`cauce[i] = 1`). */
export function superficieInundada(umbral: Float32Array, cauce: Uint8Array, cota: number, celda_m: number): number {
  let celdas = 0;
  for (let i = 0; i < umbral.length; i++) {
    if (umbral[i] <= cota && !cauce[i]) celdas++;
  }
  return (celdas * celda_m * celda_m) / 10_000;
}
