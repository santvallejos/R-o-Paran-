/** Respuesta de `GET /api/nivel` y formato de los JSON de respaldo en `public/data/nivel/`. */
export interface LecturaNivel {
  localidad: string;
  /** Altura en la escala del hidrómetro. `null` si no hay dato. */
  altura_m: number | null;
  /** Variación respecto de la lectura anterior, si la fuente la informa. */
  variacion_m?: number | null;
  /** Fecha y hora de la medición (ISO 8601, hora argentina). */
  fecha: string | null;
  /** Estado publicado por la fuente, p. ej. "EVACUACION CRECE". */
  estado?: string | null;
  fuente: string;
  url?: string;
  /** Cómo se obtuvo: automático desde la fuente o cargado a mano. */
  modo: 'automatico' | 'manual';
}
