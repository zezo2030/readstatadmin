/** Relative API prefix used in the browser (same-origin; proxied in dev/Vercel). */
const RELATIVE_API_BASE = '/api/v1';

/**
 * Browser-facing API base URL.
 *
 * Absolute `VITE_API_BASE_URL` values are always rewritten to `/api/v1` so
 * requests stay same-origin and avoid CORS. Dev (Vite) and Vercel (`vercel.json`)
 * proxy `/api` to the real backend; see `resolveProxyTarget` in vite.config.ts.
 */
function resolveApiBaseUrl(configured: string | undefined): string {
  const value = configured ?? RELATIVE_API_BASE;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return RELATIVE_API_BASE;
  }
  return value;
}

/** Runtime configuration sourced from Vite env vars (see .env.example). */
export const env = {
  apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  apiMajor: import.meta.env.VITE_API_MAJOR ?? 'v1',
};

export type Env = typeof env;
