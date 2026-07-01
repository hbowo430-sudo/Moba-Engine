import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.spec.ts'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MobaEngine',
      formats: ['es', 'umd'],
      fileName: (format) => `moba-engine.${format === 'es' ? 'esm' : 'umd'}.js`,
    },
    rollupOptions: {
      output: {
        globals: {
          'hammerjs': 'Hammer',
          'crypto-js': 'CryptoJS',
          'jszip': 'JSZip',
        },
      },
      external: [],
    },
    minify: 'terser',
    sourcemap: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@gesture': resolve(__dirname, 'src/gesture'),
      '@builder': resolve(__dirname, 'src/builder'),
      '@wasm': resolve(__dirname, 'src/wasm'),
      '@performance': resolve(__dirname, 'src/performance'),
      '@encryption': resolve(__dirname, 'src/encryption'),
      '@export-import': resolve(__dirname, 'src/export-import'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    cors: true,
  },
  preview: {
    port: 4173,
  },
});
