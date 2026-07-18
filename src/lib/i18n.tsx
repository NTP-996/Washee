import { createContext, useContext, useState, type ReactNode } from 'react';

type Lang = 'en' | 'vi';

// Auth-shell strings only for now; the full marketing-landing dictionary is
// ported alongside the landing refactor. Shares the `washee.lang` key with the
// legacy static site for a seamless carry-over.
const DICT = {
  en: {
    'nav.signin': 'Sign in',
    'cta.book': 'Book a wash',
    'auth.login.title': 'Welcome back',
    'auth.signup.title': 'Create your account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone',
    'auth.referral': 'Referral code (optional)',
    'auth.login.submit': 'Sign in',
    'auth.signup.submit': 'Create account',
    'auth.toSignup': 'New to washee? Create an account',
    'auth.toLogin': 'Already have an account? Sign in',
    'auth.logout': 'Log out',
  },
  vi: {
    'nav.signin': 'Đăng nhập',
    'cta.book': 'Đặt lịch rửa',
    'auth.login.title': 'Chào mừng trở lại',
    'auth.signup.title': 'Tạo tài khoản',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.phone': 'Số điện thoại',
    'auth.referral': 'Mã giới thiệu (tùy chọn)',
    'auth.login.submit': 'Đăng nhập',
    'auth.signup.submit': 'Tạo tài khoản',
    'auth.toSignup': 'Chưa có tài khoản? Đăng ký',
    'auth.toLogin': 'Đã có tài khoản? Đăng nhập',
    'auth.logout': 'Đăng xuất',
  },
} as const;

type Key = keyof (typeof DICT)['en'];

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
}

const I18nContext = createContext<I18n | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('washee.lang');
  if (stored === 'en' || stored === 'vi') return stored;
  return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = (l: Lang): void => {
    localStorage.setItem('washee.lang', l);
    setLangState(l);
  };
  const t = (key: Key): string => DICT[lang][key] ?? DICT.en[key];
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
