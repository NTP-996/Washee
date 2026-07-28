import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { ApiRequestError } from '../lib/api';
import { Button, Field, TextInput } from '../components/ui';
import AuthShell from '../components/AuthShell';
import SignInOptions from '../components/auth/SignInOptions';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: { pathname: string } } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname ?? '/profile', { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('auth.login.title')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.email')}>
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t('auth.password')}>
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? '…' : t('auth.login.submit')}
        </Button>
      </form>
      <SignInOptions
        onDone={() => nav(loc.state?.from?.pathname ?? '/profile', { replace: true })}
      />
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/signup" className="text-brand-from hover:underline">
          {t('auth.toSignup')}
        </Link>
      </p>
    </AuthShell>
  );
}
