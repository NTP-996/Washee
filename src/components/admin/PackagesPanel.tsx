import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import type { CarType, WashPackage } from '../../types';
import { Button, Field, TextInput } from '../ui';
import { pillButton } from './listControls';

// Package catalog CRUD: title/description, a price-per-car-type grid, an
// active/inactive toggle (blocked until all 3 car types are priced), delete
// (blocked while a booking references it — deactivate instead). Flat fetch,
// no pagination — packages are admin-curated and stay low-cardinality for a
// long time, unlike the customer/driver rosters.
export default function PackagesPanel() {
  const [packages, setPackages] = useState<WashPackage[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});

  async function load(): Promise<void> {
    setActionError('');
    try {
      const [pkgs, types] = await Promise.all([
        api<WashPackage[]>('/api/admin/packages?limit=200', { admin: true }),
        api<CarType[]>('/api/admin/car-types', { admin: true }),
      ]);
      setPackages(pkgs);
      setCarTypes(types);
    } catch {
      setActionError('Failed to load packages');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent): Promise<void> {
    e.preventDefault();
    setActionError('');
    setBusy(true);
    try {
      await api('/api/admin/packages', {
        admin: true,
        method: 'POST',
        body: { title, description },
      });
      setTitle('');
      setDescription('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create package');
    } finally {
      setBusy(false);
    }
  }

  function toggleEdit(pkg: WashPackage): void {
    if (editId === pkg.id) {
      setEditId(null);
      return;
    }
    setEditId(pkg.id);
    setEditTitle(pkg.title);
    setEditDescription(pkg.description);
    const prices: Record<string, string> = {};
    for (const ct of carTypes) {
      const existing = pkg.prices.find((p) => p.carTypeId === ct.id);
      prices[ct.id] = existing ? String(existing.priceVnd) : '';
    }
    setEditPrices(prices);
  }

  async function saveEdit(id: string): Promise<void> {
    setActionError('');
    try {
      let updated = await api<WashPackage>(`/api/admin/packages/${id}`, {
        admin: true,
        method: 'PATCH',
        body: { title: editTitle, description: editDescription },
      });
      const priceEntries = carTypes
        .map((ct) => ({ carTypeId: ct.id, priceVnd: Number(editPrices[ct.id]) }))
        .filter((p) => editPrices[p.carTypeId]?.trim() && !Number.isNaN(p.priceVnd));
      if (priceEntries.length > 0) {
        updated = await api<WashPackage>(`/api/admin/packages/${id}/prices`, {
          admin: true,
          method: 'PUT',
          body: priceEntries,
        });
      }
      setPackages((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function toggleStatus(pkg: WashPackage): Promise<void> {
    setActionError('');
    try {
      const updated = await api<WashPackage>(`/api/admin/packages/${pkg.id}`, {
        admin: true,
        method: 'PATCH',
        body: { status: pkg.status === 'active' ? 'inactive' : 'active' },
      });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'package_incomplete') {
        setActionError(
          'This package needs a price for all 3 car types before it can be activated.',
        );
      } else {
        setActionError(err instanceof Error ? err.message : 'Update failed');
      }
    }
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Delete this package?')) return;
    setActionError('');
    try {
      await api(`/api/admin/packages/${id}`, { admin: true, method: 'DELETE' });
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'package_in_use') {
        setActionError('This package has booking history — deactivate it instead.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Packages</h2>
      {actionError && <p className="mb-3 text-sm text-red-400">{actionError}</p>}

      {packages.length === 0 ? (
        <p className="text-sm text-muted">No packages yet.</p>
      ) : (
        <ul className="space-y-2">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold">{pkg.title}</span>
                  {pkg.description && (
                    <span className="ml-2 text-xs text-muted">{pkg.description}</span>
                  )}
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    pkg.status === 'active'
                      ? 'border-brand-to/40 text-brand-from'
                      : 'border-hairline text-muted'
                  }`}
                >
                  {pkg.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                {pkg.prices.length > 0 ? (
                  pkg.prices.map((p) => (
                    <span key={p.carTypeId} className="tabular-nums">
                      {p.carTypeName}: {formatVnd(p.priceVnd)}
                    </span>
                  ))
                ) : (
                  <span>No prices set yet</span>
                )}
                <span>· {pkg.eligibleDriverCount} eligible driver(s)</span>
              </div>

              {editId === pkg.id && (
                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextInput
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      aria-label="Title"
                    />
                    <TextInput
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      aria-label="Description"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {carTypes.map((ct) => (
                      <Field key={ct.id} label={`${ct.name} price (₫)`}>
                        <TextInput
                          inputMode="numeric"
                          value={editPrices[ct.id] ?? ''}
                          onChange={(e) =>
                            setEditPrices((prev) => ({ ...prev, [ct.id]: e.target.value }))
                          }
                          className="tabular-nums"
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void saveEdit(pkg.id)} className={pillButton}>
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className={pillButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleEdit(pkg)} className={pillButton}>
                  Edit
                </button>
                <button onClick={() => void toggleStatus(pkg)} className={pillButton}>
                  {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => void remove(pkg.id)}
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
        <h3 className="mb-3 text-xs uppercase tracking-widest text-muted">Add package</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Description">
            <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" disabled={busy} className="mt-4">
          Create package
        </Button>
      </form>
    </section>
  );
}
