import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'], // Specify browser support
    }),
  ],
  build: {
    outDir: 'dist', // Output directory
  },
});
