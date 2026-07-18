import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import type { User } from '../types';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [me, setMe] = useState<User | null>(user);
  const [copied, setCopied] = useState(false);

  // Refresh from the server (proves the bearer + refresh flow end-to-end).
  useEffect(() => {
    api<User>('/api/users/me')
      .then(setMe)
      .catch(() => undefined);
  }, []);

  const shareUrl = me ? `${window.location.origin}/signup?ref=${me.referralCode}` : '';

  async function onLogout(): Promise<void> {
    await logout();
    nav('/', { replace: true });
  }

  function copy(): void {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-5 py-10 text-ink">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <button onClick={onLogout} className="rounded-full border border-hairline px-4 py-2 text-sm">
          {t('auth.logout')}
        </button>
      </div>

      <section className="rounded-2xl border border-hairline bg-panel p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted">Email</dt>
          <dd>{me?.email}</dd>
          <dt className="text-muted">Phone</dt>
          <dd>{me?.phone}</dd>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-hairline bg-panel p-6">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-muted">Your referral link</h2>
        <p className="mb-4 text-sm text-muted">A friend&apos;s first wash earns you 50% off.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-xl border border-hairline bg-panel-2 px-3 py-2.5 text-sm text-brand-from">
            {shareUrl}
          </code>
          <button
            onClick={copy}
            className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-[color:var(--color-on-accent)]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>
    </main>
  );
}
