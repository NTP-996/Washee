import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { PAGE_LIMIT, useAdminPagedList } from '../../lib/useAdminPagedList';
import type { AdminDriver, WashPackage } from '../../types';
import { Button, Field, StarRating, TextInput } from '../ui';
import { LoadMoreButton, pillButton } from './listControls';

// Driver roster + CRUD: search by username/name/phone, create, edit name/phone,
// reset password, toggle active/inactive, delete (blocked while the driver
// still owns slots).
export default function DriversPanel() {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPackageIds, setEditPackageIds] = useState<Set<string>>(new Set());
  const [packages, setPackages] = useState<WashPackage[]>([]);

  useEffect(() => {
    api<WashPackage[]>('/api/admin/packages?limit=200', { admin: true })
      .then(setPackages)
      .catch(() => setActionError('Failed to load packages'));
  }, []);

  const fetchPage = useCallback(
    (before: string) => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT + 1) });
      if (appliedQuery.trim()) params.set('q', appliedQuery.trim());
      if (before) params.set('before', before);
      return api<AdminDriver[]>(`/api/admin/drivers?${params}`, { admin: true });
    },
    [appliedQuery],
  );
  const {
    items: drivers,
    setItems: setDrivers,
    hasMore,
    loadingMore,
    error,
    reload,
    loadMore,
  } = useAdminPagedList(fetchPage, (d) => d.createdAt);

  function search(e: FormEvent): void {
    e.preventDefault();
    setAppliedQuery(query);
  }

  async function create(e: FormEvent): Promise<void> {
    e.preventDefault();
    setActionError('');
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
      await reload();
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'username_taken') {
        setActionError('That username is already taken.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to create driver');
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>): Promise<boolean> {
    setActionError('');
    try {
      const updated = await api<AdminDriver>(`/api/admin/drivers/${id}`, {
        admin: true,
        method: 'PATCH',
        body,
      });
      setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed');
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
    setEditPackageIds(new Set(d.packageIds));
  }

  async function saveEdit(id: string): Promise<void> {
    // Keep the edit row open (input intact) when the PATCH fails.
    if (!(await patch(id, { fullName: editName, phone: editPhone }))) return;
    try {
      await api(`/api/admin/drivers/${id}/packages`, {
        admin: true,
        method: 'PUT',
        body: { packageIds: Array.from(editPackageIds) },
      });
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, packageIds: Array.from(editPackageIds) } : d)),
      );
      setEditId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update package tags');
    }
  }

  function togglePackage(packageId: string): void {
    setEditPackageIds((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) next.delete(packageId);
      else next.add(packageId);
      return next;
    });
  }

  function resetPassword(id: string): void {
    const next = window.prompt('New password for this driver:');
    if (next) void patch(id, { password: next });
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Delete this driver?')) return;
    setActionError('');
    try {
      await api(`/api/admin/drivers/${id}`, { admin: true, method: 'DELETE' });
      await reload();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setActionError('Driver still owns schedule slots — deactivate instead.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Drivers</h2>

      <form onSubmit={search} className="mb-4 flex items-center gap-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username, name, or phone"
          aria-label="Search drivers"
        />
        <button type="submit" className={`${pillButton} shrink-0 px-4 py-2`}>
          Search
        </button>
      </form>

      {(error || actionError) && (
        <p className="mb-3 text-sm text-red-400">{error || actionError}</p>
      )}

      {drivers.length === 0 ? (
        <p className="text-sm text-muted">No drivers found.</p>
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
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span>{d.phone}</span>
                <span className="tabular-nums">
                  · {d.openSlots} open · {d.bookedSlots} booked
                </span>
                {d.reviewCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    · <StarRating value={Math.round(d.avgWashRating)} size="sm" />
                    <span className="tabular-nums">
                      {d.avgWashRating.toFixed(1)} ({d.reviewCount})
                    </span>
                  </span>
                ) : (
                  <span>· No reviews yet</span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted">
                ·{' '}
                {d.packageIds.length === 0
                  ? 'No packages assigned'
                  : packages
                      .filter((pkg) => d.packageIds.includes(pkg.id))
                      .map((pkg) => pkg.title)
                      .join(', ') || `${d.packageIds.length} package(s)`}
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
                  <div className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm text-muted">Eligible packages</span>
                    {packages.length === 0 ? (
                      <p className="text-xs text-muted">No packages exist yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {packages.map((pkg) => (
                          <label key={pkg.id} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={editPackageIds.has(pkg.id)}
                              onChange={() => togglePackage(pkg.id)}
                              className="h-4 w-4 accent-brand-to"
                            />
                            {pkg.title}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
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

      <LoadMoreButton hasMore={hasMore} loadingMore={loadingMore} onClick={() => void loadMore()} />

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
