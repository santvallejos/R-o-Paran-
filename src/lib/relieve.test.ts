import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolverTiles, urlRelieve } from './relieve';

const BUCKET = 'https://abc.supabase.co/storage/v1/object/public/relieve';

// Cada test arranca sin VITE_RELIEVE_BASE ni location simulados.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('urlRelieve', () => {
  it('sin VITE_RELIEVE_BASE usa /data/relieve del origen recibido', () => {
    vi.stubEnv('VITE_RELIEVE_BASE', '');
    expect(urlRelieve('paso-de-la-patria', 'https://crecida.app')).toBe('https://crecida.app/data/relieve/paso-de-la-patria');
  });

  it('sin origen toma location.origin', () => {
    vi.stubEnv('VITE_RELIEVE_BASE', '');
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
    expect(urlRelieve('itati')).toBe('http://localhost:5173/data/relieve/itati');
  });

  it('con VITE_RELIEVE_BASE usa el bucket (e ignora el origen y la barra final)', () => {
    vi.stubEnv('VITE_RELIEVE_BASE', `${BUCKET}/`);
    expect(urlRelieve('paso-de-la-patria', 'https://crecida.app')).toBe(`${BUCKET}/paso-de-la-patria`);
  });
});

describe('resolverTiles', () => {
  const plantilla = '/{z}/{x}/{y}.png';

  it('ruta relativa (terreno.json nuevo) contra el bucket', () => {
    expect(resolverTiles('terreno/{z}/{x}/{y}.png', 'paso', `${BUCKET}/paso`)).toBe(`${BUCKET}/paso/terreno${plantilla}`);
  });

  it('ruta vieja del sitio (/data/relieve/<id>/…) también va al bucket', () => {
    expect(resolverTiles('/data/relieve/paso/terreno/{z}/{x}/{y}.png', 'paso', `${BUCKET}/paso`)).toBe(
      `${BUCKET}/paso/terreno${plantilla}`,
    );
  });

  it('sin bucket queda igual que antes', () => {
    const base = 'http://localhost:5173/data/relieve/paso';
    expect(resolverTiles('/data/relieve/paso/terreno/{z}/{x}/{y}.png', 'paso', base)).toBe(`${base}/terreno${plantilla}`);
    expect(resolverTiles('terreno/{z}/{x}/{y}.png', 'paso', base)).toBe(`${base}/terreno${plantilla}`);
  });

  it('una URL absoluta no se toca', () => {
    const abs = 'https://otro.host/t/{z}/{x}/{y}.png';
    expect(resolverTiles(abs, 'paso', `${BUCKET}/paso`)).toBe(abs);
  });
});
