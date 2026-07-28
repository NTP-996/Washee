import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../context/AuthContext';
import { loginWithPasskey, passkeySupported } from '../../lib/webauthn';
import { signInWithApple, signInWithGoogle } from '../../lib/federated';
import type { AuthResult } from '../../types';

interface Methods {
  password: boolean;
  passkey: boolean;
  google: boolean;
  apple: boolean;
  googleClientId?: string;
  appleClientId?: string;
}

// Cache the methods probe so login + signup don't each hit the endpoint.
let methodsPromise: Promise<Methods> | null = null;
function getMethods(): Promise<Methods> {
  if (!methodsPromise) methodsPromise = api<Methods>('/api/auth/methods', { auth: false });
  return methodsPromise;
}

// Alternative sign-in options shown beneath the email/password form on both the
// login and signup pages. Only methods the backend reports enabled render; the
// passkey button additionally requires browser support. On success the session
// is adopted and onDone() navigates.
export default function SignInOptions({
  onDone,
  referralCode,
}: {
  onDone: () => void;
  referralCode?: string;
}) {
  const { t, lang } = useI18n();
  const { adopt } = useAuth();
  const [methods, setMethods] = useState<Methods | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMethods()
      .then(setMethods)
      .catch(() => setMethods({ password: true, passkey: false, google: false, apple: false }));
  }, []);

  const showPasskey = methods?.passkey && passkeySupported();
  const showGoogle = methods?.google && methods.googleClientId;
  const showApple = methods?.apple && methods.appleClientId;
  if (!showPasskey && !showGoogle && !showApple) return null;

  async function run(name: string, fn: () => Promise<void>): Promise<void> {
    setError('');
    setBusy(name);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('auth.passkeyFail'));
    } finally {
      setBusy(null);
    }
  }

  function passkey(): Promise<void> {
    return run('passkey', async () => {
      const res = await loginWithPasskey();
      if (!res) return; // user cancelled
      adopt(res);
      onDone();
    });
  }

  function oauth(provider: 'google' | 'apple', getToken: () => Promise<string>): Promise<void> {
    return run(provider, async () => {
      const idToken = await getToken();
      const res = await api<AuthResult>('/api/auth/oauth', {
        method: 'POST',
        auth: false,
        body: { provider, idToken, referralCode, preferredLang: lang },
      });
      adopt(res);
      onDone();
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-hairline" />
        {t('auth.or')}
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <div className="space-y-2.5">
        {showPasskey && (
          <OptionButton
            onClick={passkey}
            busy={busy === 'passkey'}
            label={t('auth.passkey')}
            icon="face"
          />
        )}
        {showGoogle && (
          <OptionButton
            onClick={() => oauth('google', () => signInWithGoogle(methods!.googleClientId!))}
            busy={busy === 'google'}
            label={t('auth.google')}
            icon="google"
          />
        )}
        {showApple && (
          <OptionButton
            onClick={() => oauth('apple', () => signInWithApple(methods!.appleClientId!))}
            busy={busy === 'apple'}
            label={t('auth.apple')}
            icon="apple"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function OptionButton({
  onClick,
  busy,
  label,
  icon,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  icon: 'face' | 'google' | 'apple';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-hairline bg-panel-2 px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-to disabled:opacity-60"
    >
      <ProviderIcon icon={icon} />
      {busy ? '…' : label}
    </button>
  );
}

function ProviderIcon({ icon }: { icon: 'face' | 'google' | 'apple' }) {
  if (icon === 'google') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
    );
  }
  if (icon === 'apple') {
    return (
      <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
        <path d="M13.4 9.6c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2C1 8.6 2 12 3.4 13.9c.7.9 1.5 1.9 2.5 1.9s1.3-.6 2.5-.6 1.5.6 2.6.6 1.7-.9 2.4-1.8c.7-1 1-2 1-2s-1.9-.7-2-2.4zM11 3.6c.5-.7.9-1.6.8-2.6-.8 0-1.8.5-2.4 1.2-.5.6-1 1.5-.8 2.4.9.1 1.8-.4 2.4-1z" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M12 2a4 4 0 0 1 4 4v2M12 2a4 4 0 0 0-4 4v2" />
      <rect x="5" y="8" width="14" height="12" rx="2.5" />
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" />
      <path d="M9.5 16.5c.7.6 1.6.9 2.5.9s1.8-.3 2.5-.9" />
    </svg>
  );
}
