import { useEffect, useRef, useState } from 'react';
import { agruparPorRegion, listarLocalidades } from '../../shared/localidades';
import { ESTILO_ESTADO, estadoTodas, type EstadoLocalidad } from '../lib/estadoRegion';
import { alClicNavegar, urlDeLocalidad } from '../lib/navegacion';

interface Props {
  /** Id de la localidad que se está viendo. */
  actual: string;
  /** Cambia de localidad; `null` vuelve a la pantalla regional. */
  onElegir: (id: string | null) => void;
}

const grupos = agruparPorRegion(listarLocalidades());

// Al cambiar de localidad la vista se desmonta entera (key): con esto el selector nuevo recupera el foco
// y quien navega con el teclado no vuelve al principio de la página.
let enfocarAlMontar = false;

/**
 * Cabecera de navegación del panel: un `<select>` nativo agrupado por región (en el celular abre el
 * selector del sistema, cómodo con el pulgar) con el estado de cada localidad, y el link para volver al
 * mapa regional.
 */
export function SelectorLocalidad({ actual, onElegir }: Props) {
  const select = useRef<HTMLSelectElement>(null);
  const [estados, setEstados] = useState<Record<string, EstadoLocalidad>>();

  useEffect(() => {
    if (enfocarAlMontar) select.current?.focus();
    enfocarAlMontar = false;
    let vigente = true;
    estadoTodas().then((e) => vigente && setEstados(e));
    return () => {
      vigente = false;
    };
  }, []);

  // "Itatí · Alerta": el estado sólo cuando hay dato, para no llenar la lista de "sin dato".
  const texto = (id: string, nombre: string) => {
    const e = estados?.[id]?.estado;
    return e && e !== 'sin-dato' ? `${nombre} · ${ESTILO_ESTADO[e].texto}` : nombre;
  };

  return (
    <nav className="selector-localidad" aria-label="Cambiar de localidad">
      <label className="oculto-visual" htmlFor="selector-localidad">
        Localidad
      </label>
      <select
        id="selector-localidad"
        ref={select}
        value={actual}
        onChange={(e) => {
          enfocarAlMontar = true;
          onElegir(e.target.value);
        }}
      >
        {grupos.map((g) => (
          <optgroup key={g.region.id} label={`${g.region.nombre} · ${g.provincias.join(', ')}`}>
            {g.localidades.map((l) => (
              <option key={l.id} value={l.id}>
                {texto(l.id, l.nombre)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {/* Link real: con Ctrl/⌘ abre el mapa regional en otra pestaña. */}
      <a className="selector-localidad__region" href={urlDeLocalidad(null)} onClick={(e) => alClicNavegar(e, () => onElegir(null))}>
        Ver todas
      </a>
    </nav>
  );
}
