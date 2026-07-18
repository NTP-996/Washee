import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { ApiRequestError } from '../lib/api';
import { Button, Field, TextInput } from '../components/ui';
import AuthShell from '../components/AuthShell';

export default function SignupPage() {
  const { signup } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const refParam = params.get('ref') ?? '';

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(refParam);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup({ email, password, phone, referralCode: referralCode || undefined });
      nav('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('auth.signup.title')}>
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
        <Field label={t('auth.phone')}>
          <TextInput
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label={t('auth.password')}>
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label={t('auth.referral')}>
          <TextInput
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            readOnly={!!refParam}
            placeholder="WSH…"
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? '…' : t('auth.signup.submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-brand-from hover:underline">
          {t('auth.toLogin')}
        </Link>
      </p>
    </AuthShell>
  );
}
