import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-5 py-10 text-ink">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <button onClick={onLogout} className="rounded-full border border-hairline px-4 py-2 text-sm">
          {t('auth.logout')}
        </button>
      </div>
      <div className="space-y-6">
        <ProfileCard user={me} onUpdate={setMe} />
        <CarLocationList />
        <ReferralCard />
      </div>
    </main>
  );
}
