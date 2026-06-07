import type { UserSelf } from '@/api/types';

const STORAGE_KEY = 'admin.session';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds at which the access token expires. */
  accessTokenExpiresAt: number;
  user: UserSelf;
};

export const tokenStorage = {
  get(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },
  set(session: StoredSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
