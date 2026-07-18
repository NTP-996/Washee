import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';

// Minimal branded landing for the auth slice. The full Three.js marketing site
// (in legacy/) is ported in a later pass.
export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const primaryTo = user ? '/booking' : '/signup';

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/washee-mark.svg" alt="" width={32} height={32} />
          <span className="text-lg font-semibold lowercase tracking-tight">washee</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link to="/profile" className="rounded-full border border-hairline px-4 py-2">
              Profile
            </Link>
          ) : (
            <Link to="/login" className="text-muted transition hover:text-ink">
              {t('nav.signin')}
            </Link>
          )}
          <Link
            to={primaryTo}
            className="brand-gradient rounded-full px-5 py-2 font-semibold text-[color:var(--color-on-accent)]"
          >
            {t('cta.book')}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:pt-28">
        <div className="speed-stripe mb-6 h-1 w-16 rounded-full" />
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Your car, <span className="grad-text">washed</span> where it stands.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Book a 60-minute wash, a vetted pro comes to your car, track it live, pay cashless.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={primaryTo}
            className="brand-gradient rounded-full px-7 py-3.5 font-semibold text-[color:var(--color-on-accent)]"
          >
            {t('cta.book')}
          </Link>
          {!user && (
            <Link to="/login" className="rounded-full border border-hairline px-7 py-3.5 font-semibold">
              {t('nav.signin')}
            </Link>
          )}
        </div>
        <p className="mt-16 text-xs uppercase tracking-widest text-muted">
          Full marketing site — porting from legacy/ in a later pass
        </p>
      </section>
    </main>
  );
}
