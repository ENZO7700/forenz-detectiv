import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base44 from '@base44/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// #region agent log
function agentDebugLogPlugin() {
  const logPath = path.resolve(__dirname, 'debug-121488.log');
  return {
    name: 'agent-debug-log',
    configureServer(server) {
      server.middlewares.use('/__agent_debug', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const payload = JSON.parse(raw);
            fs.appendFileSync(
              logPath,
              `${JSON.stringify({ sessionId: '121488', timestamp: Date.now(), ...payload })}\n`
            );
          } catch (_) {
            /* ignore */
          }
          res.statusCode = 204;
          res.end();
        });
      });
    }
  };
}
// #endregion

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Windows/Brave: host "localhost" binds IPv6-only (::1); WS then flakes.
    // Pin IPv4 so HTTP + HMR WebSocket share the same reachable endpoint.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5173,
      clientPort: 5173
    }
  },
  plugins: [
    // #region agent log
    agentDebugLogPlugin(),
    // #endregion
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
  optimizeDeps: {
    // Ensure pdf.js is prebundled so first PDF upload does not race a cold dep optimize.
    include: ['pdfjs-dist']
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf': ['pdf-lib', '@pdf-lib/fontkit', 'pdfjs-dist'],
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
    exclude: ['node_modules', 'dist', 'tests/integrity.test.js', 'tests/legalIntegration.test.js', 'tests/diagnostics.test.js']
  }
});
