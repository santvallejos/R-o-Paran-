/** Perfil de LinkedIn del autor. */
const LINKEDIN = 'https://www.linkedin.com/in/santiago-maximiliano-vallejos/';

/**
 * Crédito del autor al pie del panel (mapa regional y localidad).
 * Va al final del contenido desplazable para no tapar el mapa ni competir con los datos.
 */
export function Autor() {
  return (
    <p className="autor">
      Hecho por Santiago Vallejos ·{' '}
      <a href={LINKEDIN} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
    </p>
  );
}
