import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import type { User } from '../types';
import ProfileCard from '../components/profile/ProfileCard';
import CarLocationList from '../components/profile/CarLocationList';
import ReferralCard from '../components/profile/ReferralCard';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [me, setMe] = useState<User | null>(user);

  useEffect(() => {
    document.title = 'washee — Profile';
  }, []);

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

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/washee-mark.svg" alt="" className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-tight">washee</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/booking"
              className="rounded-full border border-hairline px-4 py-2 text-sm transition hover:border-brand-to"
            >
              Book a wash
            </Link>
            <button
              onClick={onLogout}
              className="rounded-full border border-hairline px-4 py-2 text-sm text-muted transition hover:border-brand-to hover:text-ink"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
        <div className="mb-6">
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Profile</h1>
        </div>
        <div className="space-y-6">
          <ProfileCard user={me} onUpdate={setMe} />
          <CarLocationList />
          <ReferralCard />
        </div>
      </div>
    </main>
  );
}
