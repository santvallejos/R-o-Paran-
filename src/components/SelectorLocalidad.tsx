import { localidades } from '../../shared/localidades';
import { alClicNavegar, urlDeLocalidad } from '../lib/navegacion';

interface Props {
  /** Id de la localidad que se está viendo. */
  actual: string;
  /** Cambia de localidad; `null` vuelve a la pantalla regional. */
  onElegir: (id: string | null) => void;
}

/** Localidades agrupadas por provincia y ordenadas por nombre, para el `<select>`. */
function porProvincia() {
  const grupos = new Map<string, { id: string; nombre: string }[]>();
  const todas = Object.values(localidades).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  for (const l of todas) {
    const lista = grupos.get(l.provincia) ?? [];
    lista.push({ id: l.id, nombre: l.nombre });
    grupos.set(l.provincia, lista);
  }
  return [...grupos].sort(([a], [b]) => a.localeCompare(b, 'es'));
}

/**
 * Cabecera de navegación del panel: un `<select>` nativo (en el celular abre el selector
 * del sistema, cómodo con el pulgar) y el link para volver al mapa regional.
 */
export function SelectorLocalidad({ actual, onElegir }: Props) {
  const grupos = porProvincia();
  return (
    <nav className="selector-localidad" aria-label="Cambiar de localidad">
      <label className="oculto-visual" htmlFor="selector-localidad">
        Localidad
      </label>
      <select id="selector-localidad" value={actual} onChange={(e) => onElegir(e.target.value)}>
        {grupos.map(([provincia, lista]) => (
          <optgroup key={provincia} label={provincia}>
            {lista.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {/* Link real: con Ctrl/⌘ abre el mapa regional en otra pestaña. */}
      <a className="selector-localidad__nea" href={urlDeLocalidad(null)} onClick={(e) => alClicNavegar(e, () => onElegir(null))}>
        Ver NEA
      </a>
    </nav>
  );
}
