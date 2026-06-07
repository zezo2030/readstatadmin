import os from 'node:os';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Backend port the NestJS API listens on (see backend/.env PORT). */
const API_PORT = Number(process.env.VITE_DEV_API_PORT ?? 3000);

/**
 * Resolve where the Vite dev proxy should forward `/api` requests.
 *
 * On Windows, another process (e.g. Cursor) may bind 127.0.0.1:3000 while the
 * API listens on 0.0.0.0:3000 — `localhost` then hits the wrong listener and
 * the proxy returns 500 / "socket hang up". Prefer the LAN IPv4 address, which
 * reaches the API's 0.0.0.0 bind. Override with VITE_DEV_PROXY_TARGET.
 */
function resolveDevProxyTarget(): string {
  if (process.env.VITE_DEV_PROXY_TARGET) {
    return process.env.VITE_DEV_PROXY_TARGET;
  }

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return `http://${entry.address}:${API_PORT}`;
      }
    }
  }

  return `http://127.0.0.1:${API_PORT}`;
}

/** When VITE_API_BASE_URL is absolute, derive the proxy target (scheme + host). */
function resolveProxyTarget(apiBaseUrl: string): string {
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    return new URL(apiBaseUrl).origin;
  }
  return resolveDevProxyTarget();
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load `.env` so VITE_* vars are available in this config file.
  const env = loadEnv(mode, process.cwd(), '');
  const configuredApiBaseUrl = env.VITE_API_BASE_URL ?? '/api/v1';
  const isRemoteApi =
    configuredApiBaseUrl.startsWith('http://') ||
    configuredApiBaseUrl.startsWith('https://');

  // In dev, route browser calls through the Vite proxy so a remote API works
  // without CORS. Production builds with a relative /api/v1 rely on vercel.json
  // (or another reverse proxy) to forward /api to the backend.
  const devApiBaseUrl =
    mode === 'development' && isRemoteApi ? '/api/v1' : configuredApiBaseUrl;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(devApiBaseUrl),
    },
    server: {
      port: 5173,
      proxy: {
        // Dev convenience: proxy `/api` to local or remote backend without CORS.
        '/api': {
          target: resolveProxyTarget(configuredApiBaseUrl),
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
