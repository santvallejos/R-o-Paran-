import { useState } from 'react';

/**
 * Aviso fijo arriba de cada pantalla (mapa regional y localidad).
 * Siempre muestra una línea corta: los datos y el mapa son estimados y no reemplazan a las fuentes oficiales.
 * "Más info" despliega el alcance completo: fin educativo y práctico del proyecto y a quién seguir en una emergencia.
 */
export function Aviso() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="aviso" role="note">
      <strong>Datos y mapa estimados.</strong> No reemplazan la información oficial.{' '}
      <button type="button" className="aviso__mas" aria-expanded={abierto} aria-controls="aviso-detalle" onClick={() => setAbierto(!abierto)}>
        {abierto ? 'Cerrar' : 'Más info'}
      </button>
      {/* Detalle desplegable: se oculta con `hidden` para que el lector de pantalla no lo lea cerrado. */}
      <div id="aviso-detalle" className="aviso__detalle" hidden={!abierto}>
        <p>
          Este proyecto tiene un <strong>fin educativo y práctico</strong>: ayudar a entender cómo una crecida del río Paraná puede afectar a cada
          localidad.
        </p>
        <p>
          La altura del río, las zonas inundables, el mapa y la vista 3D son <strong>estimaciones</strong> calculadas con relieve satelital y datos
          públicos; pueden tener errores. No reemplazan los datos ni las indicaciones de las fuentes oficiales (Prefectura Naval Argentina, INA,
          municipio y Defensa Civil).
        </p>
        <p>Ante una crecida o una emergencia, seguí siempre las indicaciones oficiales.</p>
      </div>
    </div>
  );
}
