import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { tokenStore } from '../lib/auth';
import { useI18n, type Lang } from '../lib/i18n';
import type { AuthResult, User } from '../types';

interface SignupInput {
  email: string;
  password: string;
  phone: string;
  referralCode?: string;
  preferredLang?: Lang;
}

interface AuthState {
  user: User | null;
  signup: (input: SignupInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  // Adopt a session obtained out-of-band (OAuth / passkey), storing tokens and
  // applying the account's language exactly like a password login.
  adopt: (res: AuthResult) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStore.user);
  // I18nProvider wraps AuthProvider (see main.tsx), so the account language
  // preference can follow the customer onto any device after auth.
  const { setLang } = useI18n();

  const value = useMemo<AuthState>(
    () => ({
      user,
      async signup(input) {
        const res = await api<AuthResult>('/api/auth/signup', {
          method: 'POST',
          body: input,
          auth: false,
        });
        tokenStore.set(res);
        setUser(res.user);
        if (res.user.preferredLang) setLang(res.user.preferredLang);
      },
      async login(email, password) {
        const res = await api<AuthResult>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          auth: false,
        });
        tokenStore.set(res);
        setUser(res.user);
        if (res.user.preferredLang) setLang(res.user.preferredLang);
      },
      adopt(res) {
        tokenStore.set(res);
        setUser(res.user);
        if (res.user.preferredLang) setLang(res.user.preferredLang);
      },
      async logout() {
        const refreshToken = tokenStore.refresh;
        try {
          if (refreshToken) {
            await api('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
          }
        } finally {
          tokenStore.clear();
          setUser(null);
        }
      },
    }),
    [user, setLang],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
