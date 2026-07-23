import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import type { AdminCustomer } from '../../types';
import { Button, Field, TextInput } from '../ui';

const pillButton =
  'rounded-full border border-hairline px-2.5 py-1 text-xs text-muted transition hover:border-brand-to hover:text-ink';

// Customer roster + CRUD: search by email/phone, create, edit email/phone,
// delete (blocked while the customer still has bookings; soft-deleted rows
// stay listed for audit but lose their actions).
export default function CustomersPanel() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  async function load(q: string): Promise<void> {
    try {
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      setCustomers(await api<AdminCustomer[]>(`/api/admin/customers${qs}`, { admin: true }));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    void load('');
  }, []);

  function search(e: FormEvent): void {
    e.preventDefault();
    void load(query);
  }

  async function create(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/admin/customers', {
        admin: true,
        method: 'POST',
        body: { email, phone, password },
      });
      setEmail('');
      setPhone('');
      setPassword('');
      await load(query);
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'email_taken') {
        setError('That email is already registered.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create customer');
      }
    } finally {
      setBusy(false);
    }
  }

  function toggleEdit(c: AdminCustomer): void {
    if (editId === c.id) {
      setEditId(null);
      return;
    }
    setEditId(c.id);
    setEditEmail(c.email);
    setEditPhone(c.phone);
  }

  async function saveEdit(id: string): Promise<void> {
    setError('');
    try {
      await api(`/api/admin/customers/${id}`, {
        admin: true,
        method: 'PATCH',
        body: { email: editEmail, phone: editPhone },
      });
      setEditId(null);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Delete this customer?')) return;
    setError('');
    try {
      await api(`/api/admin/customers/${id}`, { admin: true, method: 'DELETE' });
      await load(query);
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'customer_has_bookings') {
        setError('Customer still has bookings — cannot delete.');
      } else {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Customers</h2>

      <form onSubmit={search} className="mb-4 flex items-center gap-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or phone"
          aria-label="Search customers"
        />
        <button type="submit" className={`${pillButton} shrink-0 px-4 py-2`}>
          Search
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {customers.length === 0 ? (
        <p className="text-sm text-muted">No customers found.</p>
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">{c.email}</span>
                  {c.deletedAt !== null && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted">
                      deleted
                    </span>
                  )}
                </div>
                <span className="text-xs tabular-nums text-muted">
                  {c.bookingsCount} {c.bookingsCount === 1 ? 'booking' : 'bookings'} ·{' '}
                  {c.activeBookings} active
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">{c.phone}</div>

              {editId === c.id && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <TextInput
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    aria-label="Email"
                  />
                  <TextInput
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    aria-label="Phone"
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <button onClick={() => void saveEdit(c.id)} className={pillButton}>
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className={pillButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {c.deletedAt === null && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => toggleEdit(c)} className={pillButton}>
                    Edit
                  </button>
                  <button
                    onClick={() => void remove(c.id)}
                    className={`${pillButton} hover:border-red-400/60 hover:text-red-400`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="mt-6 border-t border-hairline pt-5">
        <h3 className="mb-3 text-xs uppercase tracking-widest text-muted">Add customer</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Phone">
            <TextInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
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
        </div>
        <Button type="submit" disabled={busy} className="mt-4">
          Create customer
        </Button>
      </form>
    </section>
  );
}
