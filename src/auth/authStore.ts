import { create } from 'zustand';
import { api } from '@/api/client';
import { AppFailure } from '@/api/errorMapper';
import i18n from '@/i18n';
import type { AuthSession, UserSelf } from '@/api/types';
import { tokenStorage, type StoredSession } from './tokenStorage';

type Status = 'loading' | 'authenticated' | 'anonymous';

type AuthState = {
  status: Status;
  user: UserSelf | null;
  bootstrap: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Rotate tokens using the stored refresh token. Returns the new access token. */
  refresh: () => Promise<string | null>;
  setAnonymous: () => void;
};

const toSession = (data: AuthSession): StoredSession => ({
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
  accessTokenExpiresAt: Date.now() + data.expiresInSec * 1000,
  user: data.user,
});

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  bootstrap: () => {
    const session = tokenStorage.get();
    if (session && session.user.role === 'Admin') {
      set({ status: 'authenticated', user: session.user });
    } else {
      if (session) tokenStorage.clear();
      set({ status: 'anonymous', user: null });
    }
  },

  login: async (email, password) => {
    // Public endpoint: the request interceptor skips attaching a bearer token.
    const { data } = await api.post<AuthSession>('/auth/login', {
      email,
      password,
    });
    if (data.user.role !== 'Admin') {
      // Never persist a non-admin session for this dashboard.
      throw new AppFailure({
        code: 'forbidden',
        message: i18n.t('errors.adminOnly'),
      });
    }
    tokenStorage.set(toSession(data));
    set({ status: 'authenticated', user: data.user });
  },

  logout: async () => {
    const session = tokenStorage.get();
    if (session?.refreshToken) {
      // Best-effort server-side revocation; ignore failures.
      try {
        await api.post('/auth/logout', { refreshToken: session.refreshToken });
      } catch {
        /* noop */
      }
    }
    tokenStorage.clear();
    set({ status: 'anonymous', user: null });
  },

  refresh: async () => {
    const session = tokenStorage.get();
    if (!session?.refreshToken) {
      get().setAnonymous();
      return null;
    }
    try {
      const { data } = await api.post<AuthSession>('/auth/refresh', {
        refreshToken: session.refreshToken,
      });
      if (data.user.role !== 'Admin') {
        get().setAnonymous();
        return null;
      }
      tokenStorage.set(toSession(data));
      set({ status: 'authenticated', user: data.user });
      return data.accessToken;
    } catch {
      get().setAnonymous();
      return null;
    }
  },

  setAnonymous: () => {
    tokenStorage.clear();
    set({ status: 'anonymous', user: null });
  },
}));
