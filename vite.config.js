import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base44 from '@base44/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    }
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: false,
      navigationNotifier: false,
      analyticsTracker: false,
      visualEditAgent: false
    }),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf': ['pdf-lib', '@pdf-lib/fontkit'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion', 'lucide-react'],
          'vendor-graph': ['graphology', 'graphology-metrics', 'geolib']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/integrity.test.js', 'tests/legalIntegration.test.js']
  }
});
