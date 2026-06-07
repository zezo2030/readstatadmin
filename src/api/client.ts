import axios, { type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { paths } from './schema';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Version': env.apiMajor,
  },
});

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Path = keyof paths & string;

/**
 * Thin typed wrapper around the axios instance. Errors are normalized to an
 * AppFailure by the response interceptor (see authInterceptor.ts), so callers
 * can rely on a consistent error shape.
 */
export async function request<TResponse>(
  method: Method,
  url: Path | string,
  config: AxiosRequestConfig = {},
): Promise<TResponse> {
  const response = await api.request<TResponse>({ method, url, ...config });
  return response.data;
}
