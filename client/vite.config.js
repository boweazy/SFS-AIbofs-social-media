import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    // For local dev if you ever run vite directly
    host: true,
    port: Number(process.env.PORT) || 5173
  },
  preview: {
    host: true,
    port: 4173
  }
});