import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        routing: 'nav/index.html',
        linemap: 'map/index.html',
      },
    },
    outDir: 'dist',
  },
});
