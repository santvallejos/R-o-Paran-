// Navegación entre la pantalla regional (NEA) y cada localidad sin recargar la página.
// La localidad vive en `?localidad=<id>`; sin ese parámetro se muestra el mapa regional.
import type { MouseEvent } from 'react';

/** Id de localidad de la URL actual, o `null` si se pide la pantalla regional. */
export function localidadDeUrl(): string | null {
  return new URLSearchParams(location.search).get('localidad');
}

/**
 * URL para ir a una localidad (o al NEA con `null`). Conserva el resto de los parámetros
 * (p. ej. `?vista=3d`) pero descarta `?cero=`, que es una calibración de la localidad anterior.
 */
export function urlDeLocalidad(id: string | null): string {
  const u = new URL(location.href);
  if (id) u.searchParams.set('localidad', id);
  else u.searchParams.delete('localidad');
  u.searchParams.delete('cero');
  return u.pathname + u.search + u.hash;
}

/** Agrega la entrada al historial; quien llama actualiza el estado de la app. */
export function empujarLocalidad(id: string | null) {
  history.pushState(null, '', urlDeLocalidad(id));
}

/**
 * Para usar en el `onClick` de un `<a href={urlDeLocalidad(id)}>`: con un clic común navega
 * dentro de la app; con Ctrl/⌘/Shift o la rueda deja que el navegador abra otra pestaña.
 */
export function alClicNavegar(e: MouseEvent, navegar: () => void) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navegar();
}
