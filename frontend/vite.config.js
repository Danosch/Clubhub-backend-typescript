import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // keep vite’s cache in node_modules for fast FS access
  cacheDir: 'node_modules/.vite',

  // help vite prebundle known-big ESM deps, and avoid prebundling tricky ones
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'emoji-picker-react',
    ],
    // add heavy libs you actually use (examples):
    // include: ['react', 'react-dom', 'lodash-es', 'date-fns', 'zustand'],
    exclude: ['monaco-editor', 'mapbox-gl', 'firebase', 'aws-sdk'],
    esbuildOptions: {
      target: 'es2020',
    },
  },

  // speed up file watching / reduce CPU load
  server: {
    port: 3000,
    fs: { strict: true },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    // if HMR overlay is noisy/slows you down during flurries of errors:
    hmr: { overlay: true },
  },

  // make transforms a bit snappier in dev
  esbuild: {
    // keep target modern; dev doesn’t need legacy transpile
    target: 'es2020',
  },

  // prevent duplicate React if you have monorepo/linked deps
  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  // production build optimizations
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          emoji: ['emoji-picker-react'],
        },
      },
    },
    // if you import some CJS-only packages in dev, this avoids slow heuristics
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
