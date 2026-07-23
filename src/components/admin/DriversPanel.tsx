import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import type { AdminDriver } from '../../types';
import { Button, Field, TextInput } from '../ui';

const pillButton =
  'rounded-full border border-hairline px-2.5 py-1 text-xs text-muted transition hover:border-brand-to hover:text-ink';

// Driver roster + CRUD: create, edit name/phone, reset password, toggle
// active/inactive, delete (blocked while the driver still owns slots).
export default function DriversPanel() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  async function load(): Promise<void> {
    try {
      setDrivers(await api<AdminDriver[]>('/api/admin/drivers', { admin: true }));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/admin/drivers', {
        admin: true,
        method: 'POST',
        body: { username, password, fullName, phone },
      });
      setUsername('');
      setPassword('');
      setFullName('');
      setPhone('');
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'username_taken') {
        setError('That username is already taken.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create driver');
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>): Promise<boolean> {
    setError('');
    try {
      await api(`/api/admin/drivers/${id}`, { admin: true, method: 'PATCH', body });
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      return false;
    }
  }

  function toggleEdit(d: AdminDriver): void {
    if (editId === d.id) {
      setEditId(null);
      return;
    }
    setEditId(d.id);
    setEditName(d.fullName);
    setEditPhone(d.phone);
  }

  async function saveEdit(id: string): Promise<void> {
    // Keep the edit row open (input intact) when the PATCH fails.
    if (await patch(id, { fullName: editName, phone: editPhone })) setEditId(null);
  }

  function resetPassword(id: string): void {
    const next = window.prompt('New password for this driver:');
    if (next) void patch(id, { password: next });
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Delete this driver?')) return;
    setError('');
    try {
      await api(`/api/admin/drivers/${id}`, { admin: true, method: 'DELETE' });
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError('Driver still owns schedule slots — deactivate instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Drivers</h2>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {drivers.length === 0 ? (
        <p className="text-sm text-muted">No drivers yet.</p>
      ) : (
        <ul className="space-y-2">
          {drivers.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">{d.fullName}</span>{' '}
                  <span className="text-muted">@{d.username}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    d.status === 'active'
                      ? 'border-brand-to/40 text-brand-from'
                      : 'border-hairline text-muted'
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {d.phone} ·{' '}
                <span className="tabular-nums">
                  {d.openSlots} open · {d.bookedSlots} booked
                </span>
              </div>

              {editId === d.id && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <TextInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    aria-label="Full name"
                  />
                  <TextInput
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    aria-label="Phone"
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <button onClick={() => void saveEdit(d.id)} className={pillButton}>
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className={pillButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleEdit(d)} className={pillButton}>
                  Edit
                </button>
                <button onClick={() => resetPassword(d.id)} className={pillButton}>
                  Set password
                </button>
                <button
                  onClick={() =>
                    void patch(d.id, { status: d.status === 'active' ? 'inactive' : 'active' })
                  }
                  className={pillButton}
                >
                  {d.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => void remove(d.id)}
                  className={`${pillButton} hover:border-red-400/60 hover:text-red-400`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="mt-6 border-t border-hairline pt-5">
        <h3 className="mb-3 text-xs uppercase tracking-widest text-muted">Add driver</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Username">
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label="Full name">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Phone">
            <TextInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>
        </div>
        <Button type="submit" disabled={busy} className="mt-4">
          Create driver
        </Button>
      </form>
    </section>
  );
}
