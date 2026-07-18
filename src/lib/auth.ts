import type { AuthResult, User } from '../types';

// Token storage. Per the v1 spec this uses localStorage; an httpOnly-cookie
// hardening pass (XSS) is flagged for v2. Admin tokens are stored separately and
// are access-only (no refresh) — admins re-authenticate on expiry.
const ACCESS_KEY = 'washee.accessToken';
const REFRESH_KEY = 'washee.refreshToken';
const USER_KEY = 'washee.user';
const ADMIN_ACCESS_KEY = 'washee.adminAccessToken';
const ADMIN_USER_KEY = 'washee.adminUsername';

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  get user(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(result: AuthResult): void {
    localStorage.setItem(ACCESS_KEY, result.accessToken);
    localStorage.setItem(REFRESH_KEY, result.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  get adminAccess(): string | null {
    return localStorage.getItem(ADMIN_ACCESS_KEY);
  },
  get adminUsername(): string | null {
    return localStorage.getItem(ADMIN_USER_KEY);
  },
  setAdmin(accessToken: string, username: string): void {
    localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
    localStorage.setItem(ADMIN_USER_KEY, username);
  },
  clearAdmin(): void {
    localStorage.removeItem(ADMIN_ACCESS_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },
};
