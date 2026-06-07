import type { InternalAxiosRequestConfig } from 'axios';
import { api } from './client';
import { mapError, AppFailure } from './errorMapper';
import { useAuth } from '@/auth/authStore';
import { tokenStorage } from '@/auth/tokenStorage';

/** Endpoints that must never carry a bearer token / trigger refresh. */
const isPublicAuthPath = (url?: string): boolean => {
  const u = String(url ?? '');
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/register') ||
    u.includes('/auth/refresh') ||
    u.includes('/auth/password-reset')
  );
};

let refreshPromise: Promise<string | null> | null = null;

const runRefresh = (): Promise<string | null> => {
  refreshPromise =
    refreshPromise ??
    useAuth
      .getState()
      .refresh()
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
};

type RetriableConfig = InternalAxiosRequestConfig & { __retried?: boolean };

// Request: attach bearer; proactively refresh when the access token is within
// 60s of expiry so the user never sees an interactive re-login.
api.interceptors.request.use(async (config) => {
  if (isPublicAuthPath(config.url)) {
    return config;
  }
  const session = tokenStorage.get();
  if (
    session?.accessTokenExpiresAt &&
    session.accessTokenExpiresAt - Date.now() < 60_000
  ) {
    const token = await runRefresh();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  }
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response: normalize errors to AppFailure, and on a genuine 401 try a single
// refresh-and-retry before giving up and dropping to the anonymous state.
api.interceptors.response.use(undefined, async (error) => {
  const failure = mapError(error);
  if (failure.code !== 'unauthorized') {
    return Promise.reject(failure);
  }

  const original = (failure as AppFailure & { config?: RetriableConfig }).config;
  if (isPublicAuthPath(original?.url)) {
    return Promise.reject(failure);
  }
  if (!original || original.__retried) {
    useAuth.getState().setAnonymous();
    return Promise.reject(failure);
  }

  original.__retried = true;
  const token = await runRefresh();
  if (!token) {
    useAuth.getState().setAnonymous();
    return Promise.reject(failure);
  }
  return api.request({
    ...original,
    headers: { ...original.headers, Authorization: `Bearer ${token}` },
  });
});
