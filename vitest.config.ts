import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    environment: 'node', // or 'jsdom' if you have browser-dependent tests
  },
});
