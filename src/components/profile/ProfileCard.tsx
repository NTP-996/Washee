import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { User } from '../../types';
import { Button, Field, TextInput } from '../ui';

// Account panel with an inline edit for phone/email (PATCH /api/users/me).
export default function ProfileCard({
  user,
  onUpdate,
}: {
  user: User | null;
  onUpdate: (u: User) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setError('');
    setEditing(true);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api<User>('/api/users/me', { method: 'PATCH', body: { email, phone } });
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <section className="rounded-2xl border border-hairline bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-widest text-muted">Account</h2>
          <button onClick={startEdit} className="text-sm text-brand-from hover:underline">
            Edit
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted">Email</dt>
          <dd>{user?.email}</dd>
          <dt className="text-muted">Phone</dt>
          <dd>{user?.phone}</dd>
        </dl>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">Edit account</h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? '…' : 'Save'}
          </Button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-hairline px-6 py-3 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
