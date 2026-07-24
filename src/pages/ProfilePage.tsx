import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, LangToggle, type Lang } from '../lib/i18n';
import { api } from '../lib/api';
import type { User } from '../types';
import ProfileCard from '../components/profile/ProfileCard';
import CarLocationList from '../components/profile/CarLocationList';
import ReferralCard from '../components/profile/ReferralCard';
import PasskeysCard from '../components/profile/PasskeysCard';
import AppHeader, { headerPill } from '../components/AppHeader';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [me, setMe] = useState<User | null>(user);

  useEffect(() => {
    document.title = `washee — ${t('profile.title')}`;
  }, [t]);

  // Refresh from the server (also proves the bearer + refresh flow).
  useEffect(() => {
    api<User>('/api/users/me')
      .then(setMe)
      .catch(() => undefined);
  }, []);

  async function onLogout(): Promise<void> {
    await logout();
    nav('/', { replace: true });
  }

  // Best-effort account sync — the toggle already switched the UI locally.
  function saveLang(l: Lang): void {
    void api('/api/users/me', { method: 'PATCH', body: { preferredLang: l } }).catch(
      () => undefined,
    );
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <AppHeader>
        <Link to="/booking" className={headerPill}>
          {t('cta.book')}
        </Link>
        <button onClick={onLogout} className={`${headerPill} text-muted hover:text-ink`}>
          {t('auth.logout')}
        </button>
      </AppHeader>

      <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
        <div className="mb-6">
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            {t('profile.title')}
          </h1>
        </div>
        <div className="space-y-6">
          <ProfileCard user={me} onUpdate={setMe} />
          <section className="flex items-center justify-between rounded-2xl border border-hairline bg-panel p-6">
            <h2 className="text-sm uppercase tracking-widest text-muted">
              {t('profile.language')}
            </h2>
            <LangToggle onSelect={saveLang} />
          </section>
          <PasskeysCard />
          <CarLocationList />
          <ReferralCard />
        </div>
      </div>
    </main>
  );
}
