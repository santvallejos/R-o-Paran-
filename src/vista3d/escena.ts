// Vista 3D estilizada de la crecida (three.js). Usa los mismos datos que el mapa:
// relieve corregido y modelo de inundación con conectividad, más monte (ESA WorldCover)
// y edificios (Overture Maps) generados por procesamiento/procesar.py.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import type { Modelo } from '../lib/modelo';
import type { DatosEscena, Edificio } from './datos';

export type Calidad = 'alta' | 'baja';

export interface OpcionesEscena {
  calidad: Calidad;
  /** Punto que queda en el centro de la vista, en metros locales de la grilla. */
  centro: [number, number];
  /** Etiquetas fijas (nombre del pueblo, río…), en metros locales. */
  etiquetas: { texto: string; x: number; z: number }[];
  /** Fracción de la altura de la vista que se corre el centro hacia arriba. */
  desplazamiento?: number;
  onSeleccion: (e: { indice: number; edificio: Edificio } | null) => void;
}

export const EXAG = 3; // exageración vertical común a terreno, agua y edificios
const EXAG_ARBOL = 1.6; // los árboles son ilustrativos
const PALETA: Record<number, string> = {
  10: '#7a7f45', 20: '#a3a066', 30: '#cdbb88', 40: '#d9c48c', 50: '#c9b9a3', 60: '#e3d2a6', 80: '#8a9a78', 90: '#9aa47a', 95: '#6f7a45',
};
const COLOR_SUELO = '#cdbb88';

/**
 * Cámara, niebla, límites de zoom y sombras como fracción del lado mayor del modelo (m).
 * Los factores salen de los valores ajustados a mano para Paso de la Patria
 * (1283 × 787 px de 8,49 m → lado mayor ≈ 10 890 m), así otras localidades
 * con un área más grande o más chica quedan encuadradas igual.
 */
const ESCALA = {
  camara: [0.133, 0.12, -0.24], // posición inicial respecto del centro (≈ 1450, 1300, −2600)
  objetivo: -0.014, // corrimiento en x del punto mirado (≈ −150)
  nieblaDesde: 0.24, // ≈ 2600
  nieblaHasta: 0.96, // ≈ 10 500
  distanciaMax: 0.83, // ≈ 9000
  lejos: 3.7, // plano lejano de la cámara (≈ 40 000)
  sol: [-0.32, 0.29, -0.2], // ≈ (−3500, 3200, −2200)
  sombra: 0.41, // medio lado del área con sombras (≈ 4500)
  sombraLejos: 1.1, // ≈ 12 000
} as const;

export class EscenaCrecida {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara: THREE.PerspectiveCamera;
  private controles: MapControls;
  private uAgua!: Record<string, THREE.IUniform>;
  private uEdif = { uCota: { value: 0 }, uCotaHoy: { value: -1e4 }, uSel: { value: -1 } };
  private agua: THREE.Mesh;
  private ciudad: THREE.Mesh | null = null;
  private recursos: { dispose(): void }[] = [];
  private cuadroPedido = 0;
  private etiquetas: { el: HTMLDivElement; p: THREE.Vector3 }[] = [];
  private base: number;
  private cx: number;
  private cz: number;
  private observador: ResizeObserver;

  constructor(
    private contenedor: HTMLElement,
    private m: Modelo,
    private datos: DatosEscena,
    private op: OpcionesEscena,
  ) {
    const alta = op.calidad === 'alta';
    this.cx = op.centro[0];
    this.cz = op.centro[1];
    // Referencia vertical: el pelo de agua permanente del modelo.
    this.base = mediana(m.elev, m.cauce);

    this.renderer = new THREE.WebGLRenderer({ antialias: alta, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, alta ? 2 : 1.5));
    this.renderer.shadowMap.enabled = alta;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    contenedor.appendChild(this.renderer.domElement);

    // Lado mayor del área modelada en metros: escala de toda la puesta en escena.
    const L = Math.max(m.ancho, m.alto) * m.celda_m;
    const [cx, cy, cz] = ESCALA.camara.map((f) => f * L);

    const cielo = new THREE.Color('#cfdbe0');
    this.escena.background = cielo;
    this.escena.fog = new THREE.Fog(cielo, ESCALA.nieblaDesde * L, ESCALA.nieblaHasta * L);

    this.camara = new THREE.PerspectiveCamera(36, 1, 10, Math.max(40000, ESCALA.lejos * L));
    this.camara.position.set(cx, cy, cz);
    this.controles = new MapControls(this.camara, this.renderer.domElement);
    this.controles.target.set(ESCALA.objetivo * L, 0, 0);
    Object.assign(this.controles, {
      enableDamping: true, dampingFactor: 0.08, minDistance: 250, maxDistance: ESCALA.distanciaMax * L, maxPolarAngle: 1.38, screenSpacePanning: false,
    });
    this.controles.addEventListener('change', () => this.pedirCuadro());

    this.escena.add(new THREE.HemisphereLight('#f4efe4', '#8a7a5c', 1.15));
    const sol = new THREE.DirectionalLight('#fff3dd', 2.6);
    // El sol se aleja con el área para que la cámara de sombras la cubra entera.
    sol.position.set(...(ESCALA.sol.map((f) => f * L) as [number, number, number]));
    sol.castShadow = alta;
    if (alta) {
      sol.shadow.mapSize.set(4096, 4096);
      const s = ESCALA.sombra * L;
      Object.assign(sol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 100, far: ESCALA.sombraLejos * L });
      sol.shadow.bias = -0.0004;
      sol.shadow.normalBias = 3;
    }
    this.escena.add(sol, sol.target);

    this.crearTerreno(alta ? 2 : 3, alta);
    this.agua = this.crearAgua(sol.position.clone().normalize());
    this.crearMonte(alta);
    this.crearEdificios(alta);
    for (const e of op.etiquetas) this.agregarEtiqueta(e.texto, e.x, e.z);

    this.observador = new ResizeObserver(() => this.redimensionar());
    this.observador.observe(contenedor);
    this.redimensionar();
    this.instalarSeleccion();
  }

  /** Cotas absolutas del agua simulada y de hoy (si se conoce). */
  setNivel(cotaSim: number, cotaHoy: number | null) {
    this.uAgua.uCota.value = cotaSim;
    this.uAgua.uCotaHoy.value = cotaHoy ?? 1e4;
    this.uEdif.uCota.value = cotaSim;
    this.uEdif.uCotaHoy.value = cotaHoy ?? -1e4;
    this.agua.position.y = this.y(cotaSim);
    this.pedirCuadro();
  }

  seleccionar(indice: number | null) {
    this.uEdif.uSel.value = indice ?? -1;
    this.pedirCuadro();
  }

  dispose() {
    cancelAnimationFrame(this.cuadroPedido);
    this.observador.disconnect();
    this.controles.dispose();
    for (const r of this.recursos) r.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    for (const e of this.etiquetas) e.el.remove();
  }

  // ---------------------------------------------------------------------------

  private y = (cota: number) => (cota - this.base) * EXAG;
  private lx = (x: number) => x - this.cx;
  private lz = (z: number) => z - this.cz;

  private guardar<T extends { dispose(): void }>(r: T): T {
    this.recursos.push(r);
    return r;
  }

  private pedirCuadro() {
    if (this.cuadroPedido) return;
    this.cuadroPedido = requestAnimationFrame((t) => {
      this.cuadroPedido = 0;
      const sigue = this.controles.update();
      this.uAgua.uTiempo.value = t / 1000;
      this.renderer.render(this.escena, this.camara);
      this.ubicarEtiquetas();
      if (sigue) this.pedirCuadro();
    });
  }

  private redimensionar() {
    const { clientWidth: w, clientHeight: h } = this.contenedor;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camara.aspect = w / h;
    const d = this.op.desplazamiento ?? 0;
    if (d) this.camara.setViewOffset(w, h, 0, h * d, w, h);
    this.camara.updateProjectionMatrix();
    this.pedirCuadro();
  }

  private elevEn(x: number, z: number): number {
    const { ancho, alto, celda_m, elev } = this.m;
    const c = Math.min(ancho - 1, Math.max(0, Math.round(x / celda_m)));
    const f = Math.min(alto - 1, Math.max(0, Math.round(z / celda_m)));
    return elev[f * ancho + c];
  }

  private crearTerreno(paso: number, alta: boolean) {
    const { ancho: W, alto: H, celda_m: C, elev, cauce } = this.m;
    const cob = this.datos.cobertura;
    const nx = Math.floor((W - 1) / paso) + 1;
    const nz = Math.floor((H - 1) / paso) + 1;
    const alturas = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) alturas[j * nx + i] = elev[j * paso * W + i * paso];
    // Oclusión aproximada: cuánto más bajo que su entorno (~100 m) está cada punto.
    const entorno = promedioCaja(alturas, nx, nz, Math.round(12 / paso));
    const colores = new Map(Object.entries(PALETA).map(([k, v]) => [Number(k), new THREE.Color(v)]));
    const suelo = new THREE.Color(COLOR_SUELO);
    const lecho = new THREE.Color('#8f8a6a');
    const pos = new Float32Array(nx * nz * 3);
    const col = new Float32Array(nx * nz * 3);
    const c = new THREE.Color();
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const g = j * paso * W + i * paso;
        pos[k * 3] = this.lx(i * paso * C);
        pos[k * 3 + 1] = this.y(elev[g]);
        pos[k * 3 + 2] = this.lz(j * paso * C);
        c.copy(cauce[g] ? lecho : (colores.get(cob[g]) ?? suelo));
        const ao = 1 - Math.min(0.35, Math.max(0, entorno[k] - alturas[k]) * 0.18);
        const grano = 0.94 + 0.06 * Math.sin(i * 12.9898 + j * 78.233) * Math.sin(i * 0.37 + j * 0.21);
        c.multiplyScalar(ao * grano);
        col[k * 3] = c.r;
        col[k * 3 + 1] = c.g;
        col[k * 3 + 2] = c.b;
      }
    }
    const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let n = 0;
    for (let j = 0; j < nz - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i;
        indices.set([a, a + nx, a + 1, a + 1, a + nx, a + nx + 1], n);
        n += 6;
      }
    }
    const geo = this.guardar(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    const terreno = new THREE.Mesh(geo, this.guardar(new THREE.MeshLambertMaterial({ vertexColors: true })));
    terreno.receiveShadow = alta;
    this.escena.add(terreno);
  }

  private texturaHalf(datos: Float32Array): THREE.DataTexture {
    const { ancho: W, alto: H } = this.m;
    const h = new Uint16Array(datos.length);
    for (let i = 0; i < datos.length; i++) h[i] = THREE.DataUtils.toHalfFloat(Math.min(datos[i], 60000));
    const t = this.guardar(new THREE.DataTexture(h, W, H, THREE.RedFormat, THREE.HalfFloatType));
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.unpackAlignment = 1;
    t.needsUpdate = true;
    return t;
  }

  private crearAgua(dirSol: THREE.Vector3): THREE.Mesh {
    const { ancho: W, alto: H, celda_m: C } = this.m;
    const cauce = this.guardar(new THREE.DataTexture(Uint8Array.from(this.m.cauce, (v) => v * 255), W, H, THREE.RedFormat, THREE.UnsignedByteType));
    cauce.minFilter = cauce.magFilter = THREE.LinearFilter;
    cauce.unpackAlignment = 1;
    cauce.needsUpdate = true;
    this.uAgua = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uUmbral: { value: this.texturaHalf(this.m.umbral) },
      uElev: { value: this.texturaHalf(this.m.elev) },
      uCauce: { value: cauce },
      uCota: { value: 0 },
      uCotaHoy: { value: 1e4 },
      uTiempo: { value: 0 },
      uSol: { value: dirSol },
      uGrilla: { value: new THREE.Vector3(this.cx, this.cz, C) },
      uTam: { value: new THREE.Vector2(W, H) },
    };
    const geo = this.guardar(
      new THREE.PlaneGeometry(W * C, H * C, 1, 1).rotateX(-Math.PI / 2).translate(this.lx((W * C) / 2), 0, this.lz((H * C) / 2)),
    );
    const mat = this.guardar(
      new THREE.ShaderMaterial({
        uniforms: this.uAgua,
        fog: true,
        transparent: true,
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec3 vMundo;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vMundo = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          uniform sampler2D uUmbral, uElev, uCauce;
          uniform float uCota, uCotaHoy, uTiempo;
          uniform vec3 uSol, uGrilla;
          uniform vec2 uTam;
          varying vec3 vMundo;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float ruido(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
          }
          void main() {
            vec2 uv = ((vMundo.xz + uGrilla.xy) / uGrilla.z + 0.5) / uTam;
            float cauce = texture2D(uCauce, uv).r;
            float umbral = texture2D(uUmbral, uv).r;
            // Sólo hay agua donde el terreno queda conectado con el río a esta cota.
            if (cauce < 0.5 && umbral > uCota) discard;
            float prof = max(uCota - texture2D(uElev, uv).r, 0.0);
            vec3 col = mix(vec3(0.36, 0.62, 0.70), vec3(0.08, 0.27, 0.40), smoothstep(0.0, 3.5, prof + cauce * 2.0));
            float tierra = 1.0 - cauce;
            col = mix(col, vec3(0.42, 0.55, 0.52), tierra * 0.45);
            // Agua que se suma respecto de hoy: tono cálido.
            col = mix(col, vec3(0.80, 0.50, 0.36), tierra * step(uCotaHoy, umbral) * 0.45);
            vec2 p = vMundo.xz * 0.02;
            float n1 = ruido(p + uTiempo * 0.05), n2 = ruido(p * 2.3 - uTiempo * 0.07);
            vec3 N = normalize(vec3((n1 - 0.5) * 0.25, 1.0, (n2 - 0.5) * 0.25));
            vec3 V = normalize(cameraPosition - vMundo);
            float brillo = pow(max(dot(reflect(-uSol, N), V), 0.0), 90.0);
            float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
            col = mix(col, vec3(0.80, 0.88, 0.92), fresnel * 0.35) + brillo * 0.6;
            float orilla = (1.0 - smoothstep(0.0, 0.18 + 0.12 * n1, prof)) * tierra;
            col = mix(col, vec3(0.95, 0.97, 0.97), orilla * 0.75);
            gl_FragColor = vec4(col, mix(0.88, 0.97, smoothstep(0.0, 1.5, prof)));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    );
    const agua = new THREE.Mesh(geo, mat);
    agua.renderOrder = 1;
    this.escena.add(agua);
    return agua;
  }

  private crearMonte(alta: boolean) {
    const { x, z, escala } = this.datos.arboles;
    const total = alta ? Math.min(x.length, 90000) : Math.min(x.length, 25000);
    if (!total) return;
    const copa = new THREE.IcosahedronGeometry(1, alta ? 1 : 0).scale(4.2, 3.4, 4.2).translate(0, 7.5, 0);
    const piezas = [conColor(copa, '#ffffff')];
    if (alta) piezas.push(conColor(new THREE.CylinderGeometry(0.35, 0.5, 5, 5).translate(0, 2.5, 0), '#6b5a43'));
    const geo = this.guardar(unir(piezas));
    const mat = this.guardar(new THREE.MeshLambertMaterial({ vertexColors: true }));
    const monte = this.guardar(new THREE.InstancedMesh(geo, mat, total));
    // Los árboles vienen en orden aleatorio: tomar los primeros N deja la densidad pareja.
    const d = new THREE.Object3D();
    const verde = new THREE.Color();
    for (let i = 0; i < total; i++) {
      d.position.set(this.lx(x[i]), this.y(this.elevEn(x[i], z[i])) - 1, this.lz(z[i]));
      d.rotation.y = (i * 2.399) % (Math.PI * 2);
      d.scale.set(escala[i], escala[i] * EXAG_ARBOL, escala[i]);
      d.updateMatrix();
      monte.setMatrixAt(i, d.matrix);
      monte.setColorAt(i, verde.setHSL(0.22 + 0.05 * Math.sin(i), 0.42, 0.24 + 0.06 * Math.cos(i * 0.7)));
    }
    monte.castShadow = monte.receiveShadow = alta;
    this.escena.add(monte);
  }

  private crearEdificios(alta: boolean) {
    const eds = this.datos.edificios;
    if (!eds.length) return;
    // Paredes y techo armados a mano en un único buffer (mucho más rápido que ExtrudeGeometry).
    const pos: number[] = [];
    const nor: number[] = [];
    const cota: number[] = [];
    const id: number[] = [];
    eds.forEach((e, k) => {
      const p = e.contorno;
      const n = p.length / 2;
      if (n < 3) return;
      const piso = this.y(e.base_m - 2);
      const techo = this.y(e.base_m + e.altura_m);
      const ca = e.cotaAgua ?? 1e4;
      let area = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += p[i * 2] * p[j * 2 + 1] - p[j * 2] * p[i * 2 + 1];
      }
      const s = area > 0 ? 1 : -1;
      const vert = (x: number, yy: number, z: number, nx: number, ny: number, nz: number) => {
        pos.push(this.lx(x), yy, this.lz(z));
        nor.push(nx, ny, nz);
        cota.push(ca);
        id.push(k);
      };
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [x0, z0, x1, z1] = [p[i * 2], p[i * 2 + 1], p[j * 2], p[j * 2 + 1]];
        const largo = Math.hypot(x1 - x0, z1 - z0) || 1;
        const [nx, nz] = [(s * (z1 - z0)) / largo, (-s * (x1 - x0)) / largo];
        vert(x0, piso, z0, nx, 0, nz); vert(x1, piso, z1, nx, 0, nz); vert(x1, techo, z1, nx, 0, nz);
        vert(x0, piso, z0, nx, 0, nz); vert(x1, techo, z1, nx, 0, nz); vert(x0, techo, z0, nx, 0, nz);
      }
      const contorno = Array.from({ length: n }, (_, i) => new THREE.Vector2(p[i * 2], p[i * 2 + 1]));
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contorno, [])) {
        for (const v of [a, b, c]) vert(p[v * 2], techo, p[v * 2 + 1], 0, 1, 0);
      }
    });
    const geo = this.guardar(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('aCotaAgua', new THREE.Float32BufferAttribute(cota, 1));
    geo.setAttribute('aId', new THREE.Float32BufferAttribute(id, 1));
    const mat = this.guardar(new THREE.MeshLambertMaterial({ color: '#eee8df', side: THREE.DoubleSide }));
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uEdif);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCotaAgua;\nattribute float aId;\nvarying float vCotaAgua;\nvarying float vId;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCotaAgua = aCotaAgua;\nvId = aId;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCota, uCotaHoy, uSel;\nvarying float vCotaAgua;\nvarying float vId;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          if (vCotaAgua <= uCotaHoy) diffuseColor.rgb = vec3(0.62, 0.11, 0.11);
          else if (vCotaAgua <= uCota) diffuseColor.rgb = vec3(0.93, 0.40, 0.18);
          if (abs(vId - uSel) < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.15, 0.45, 1.0), 0.75);`,
        );
    };
    this.ciudad = new THREE.Mesh(geo, mat);
    this.ciudad.castShadow = this.ciudad.receiveShadow = alta;
    this.escena.add(this.ciudad);
  }

  private agregarEtiqueta(texto: string, x: number, z: number) {
    const el = document.createElement('div');
    el.className = 'escena3d__etiqueta';
    el.textContent = texto;
    this.contenedor.appendChild(el);
    this.etiquetas.push({ el, p: new THREE.Vector3(this.lx(x), this.y(this.elevEn(x, z)) + 90, this.lz(z)) });
  }

  private ubicarEtiquetas() {
    const { clientWidth: w, clientHeight: h } = this.contenedor;
    const v = new THREE.Vector3();
    for (const e of this.etiquetas) {
      v.copy(e.p).project(this.camara);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      e.el.style.display = visible ? '' : 'none';
      e.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    }
  }

  private instalarSeleccion() {
    const ray = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let inicio: { x: number; y: number } | null = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => (inicio = { x: e.clientX, y: e.clientY }));
    el.addEventListener('pointerup', (e) => {
      // Un toque (no un arrastre) selecciona.
      if (!inicio || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 6 || !this.ciudad) return;
      const r = el.getBoundingClientRect();
      puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(puntero, this.camara);
      const [hit] = ray.intersectObject(this.ciudad);
      const ids = this.ciudad.geometry.getAttribute('aId');
      const indice = hit?.face ? ids.getX(hit.face.a) : null;
      this.seleccionar(indice);
      this.op.onSeleccion(indice === null ? null : { indice, edificio: this.datos.edificios[indice] });
    });
  }
}

function conColor(g: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(hex);
  const n = ng.getAttribute('position').count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
  ng.deleteAttribute('uv');
  return ng;
}

function unir(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (gs.length === 1) return gs[0];
  const attrs = ['position', 'normal', 'color'] as const;
  const out = new THREE.BufferGeometry();
  for (const a of attrs) {
    const partes = gs.map((g) => g.getAttribute(a).array as Float32Array);
    const total = new Float32Array(partes.reduce((s, p) => s + p.length, 0));
    let o = 0;
    for (const p of partes) {
      total.set(p, o);
      o += p.length;
    }
    out.setAttribute(a, new THREE.BufferAttribute(total, 3));
  }
  return out;
}

function mediana(elev: Float32Array, cauce: Uint8Array): number {
  const v: number[] = [];
  for (let i = 0; i < elev.length; i += 7) if (cauce[i]) v.push(elev[i]);
  if (!v.length) return Math.min(...elev.subarray(0, 1000));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}

function promedioCaja(a: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(a.length);
  const out = new Float32Array(a.length);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let s = 0;
      let n = 0;
      for (let d = -r; d <= r; d++) {
        const x = i + d;
        if (x >= 0 && x < w) {
          s += a[j * w + x];
          n++;
        }
      }
      tmp[j * w + i] = s / n;
    }
  }
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let s = 0;
      let n = 0;
      for (let d = -r; d <= r; d++) {
        const y = j + d;
        if (y >= 0 && y < h) {
          s += tmp[y * w + i];
          n++;
        }
      }
      out[j * w + i] = s / n;
    }
  }
  return out;
}
