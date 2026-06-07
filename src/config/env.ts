/** Runtime configuration sourced from Vite env vars (see .env.example). */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  apiMajor: import.meta.env.VITE_API_MAJOR ?? 'v1',
};

export type Env = typeof env;
