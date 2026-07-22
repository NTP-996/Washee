import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiRequestError } from '../../lib/api';
import { tokenStore } from '../../lib/auth';
import AppHeader from '../../components/AppHeader';
import { Button, CornerBrackets, Field, TextInput } from '../../components/ui';

interface AdminLoginResult {
  accessToken: string;
  username: string;
}

export default function AdminLoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api<AdminLoginResult>('/api/admin/login', {
        method: 'POST',
        body: { username, password },
        auth: false,
      });
      tokenStore.setAdmin(res.accessToken, res.username);
      nav('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-canvas">
      <AppHeader sub="admin" />
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="relative w-full max-w-sm rounded-2xl border border-hairline bg-panel p-6 sm:p-8">
          <CornerBrackets />
          <div className="speed-stripe mb-5 h-1 w-12 rounded-full" />
          <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-tight">Admin</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Username">
              <TextInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? '…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
