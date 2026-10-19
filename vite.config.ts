/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  // Los worktrees de los agentes viven en .claude/worktrees: sin esto vitest corre sus tests duplicados.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
