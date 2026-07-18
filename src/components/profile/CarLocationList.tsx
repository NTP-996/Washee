import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { CarLocation, LocationShortcut } from '../../types';
import { Button, Field, TextInput } from '../ui';

const SHORTCUTS: LocationShortcut[] = ['home', 'work', 'coffee', 'other'];

interface FormState {
  id?: string;
  label: string;
  address: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
  shortcut: LocationShortcut | '';
}

const EMPTY: FormState = {
  label: '',
  address: '',
  latitude: '',
  longitude: '',
  isDefault: false,
  shortcut: '',
};

// Saved car locations: list + add/edit/delete + pin (set default). The `shortcut`
// tag is only offered on the pinned location (matches the backend rule).
export default function CarLocationList() {
  const [locations, setLocations] = useState<CarLocation[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    try {
      setLocations(await api<CarLocation[]>('/api/users/me/locations'));
    } catch {
      /* leave the list as-is on transient errors */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function openEdit(l: CarLocation): void {
    setError('');
    setForm({
      id: l.id,
      label: l.label,
      address: l.address,
      latitude: String(l.latitude),
      longitude: String(l.longitude),
      isDefault: l.isDefault,
      shortcut: l.shortcut ?? '',
    });
  }

  function useMyLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) =>
          f
            ? {
                ...f,
                latitude: pos.coords.latitude.toFixed(6),
                longitude: pos.coords.longitude.toFixed(6),
              }
            : f,
        ),
      () => setError('Could not read your current location'),
    );
  }

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!form) return;
    setError('');
    setBusy(true);
    const body = {
      label: form.label,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      isDefault: form.isDefault,
      shortcut: form.isDefault && form.shortcut ? form.shortcut : null,
    };
    try {
      if (form.id) await api(`/api/users/me/locations/${form.id}`, { method: 'PATCH', body });
      else await api('/api/users/me/locations', { method: 'POST', body });
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    await api(`/api/users/me/locations/${id}`, { method: 'DELETE' }).catch(() => undefined);
    await load();
  }

  async function makeDefault(l: CarLocation): Promise<void> {
    await api(`/api/users/me/locations/${l.id}`, {
      method: 'PATCH',
      body: {
        label: l.label,
        address: l.address,
        latitude: l.latitude,
        longitude: l.longitude,
        isDefault: true,
        shortcut: l.shortcut,
      },
    }).catch(() => undefined);
    await load();
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-muted">Saved car locations</h2>
        {!form && (
          <button onClick={() => setForm({ ...EMPTY })} className="text-sm text-brand-from hover:underline">
            + Add
          </button>
        )}
      </div>

      {locations.length === 0 && !form && <p className="text-sm text-muted">No saved locations yet.</p>}

      <ul className="space-y-2">
        {locations.map((l) => (
          <li
            key={l.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-hairline bg-panel-2 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{l.label}</span>
                {l.isDefault && (
                  <span className="brand-gradient rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--color-on-accent)]">
                    Default
                  </span>
                )}
                {l.shortcut && (
                  <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    {l.shortcut}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-muted">{l.address}</p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              {!l.isDefault && (
                <button onClick={() => makeDefault(l)} className="text-brand-from hover:underline">
                  Pin
                </button>
              )}
              <button onClick={() => openEdit(l)} className="text-muted hover:text-ink">
                Edit
              </button>
              <button onClick={() => remove(l.id)} className="text-muted hover:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {form && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-hairline pt-4">
          <Field label="Label">
            <TextInput
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Home, Office…"
            />
          </Field>
          <Field label="Address">
            <TextInput
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <TextInput
                required
                inputMode="decimal"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <TextInput
                required
                inputMode="decimal"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </Field>
          </div>
          <button type="button" onClick={useMyLocation} className="text-sm text-brand-from hover:underline">
            Use my current location
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default (pinned)
          </label>

          {form.isDefault && (
            <Field label="Quick-pick tag">
              <select
                value={form.shortcut}
                onChange={(e) => setForm({ ...form, shortcut: e.target.value as LocationShortcut | '' })}
                className="w-full rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-ink outline-none focus:border-brand-to"
              >
                <option value="">None</option>
                {SHORTCUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? '…' : form.id ? 'Save' : 'Add location'}
            </Button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-full border border-hairline px-6 py-3 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
