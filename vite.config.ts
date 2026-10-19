/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  build: {
    // MapLibre solo ya pesa ~1 MB (290 kB comprimido) y no se puede achicar: el aviso salta
    // recién si algún archivo supera eso.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // MapLibre y React van en archivos propios: cambian poco entre versiones de la app, así
        // que con la caché larga de /assets (vercel.json) quien vuelve no los baja de nuevo.
        // three.js ya se carga aparte, sólo al abrir la vista 3D.
        codeSplitting: {
          groups: [
            { name: 'maplibre', test: /node_modules[\/]maplibre-gl[\/]/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
          ],
        },
      },
    },
  },
  // Los worktrees de los agentes viven en .claude/worktrees: sin esto vitest corre sus tests duplicados.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
