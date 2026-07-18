import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import type { CalendarSlot } from '../../types';
import { Button, Field, TextInput } from '../ui';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function CalendarEditor() {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [date, setDate] = useState(isoDate(1));
  const [startTime, setStartTime] = useState('09:00');
  const [price, setPrice] = useState('250000');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    try {
      setSlots(
        await api<CalendarSlot[]>(`/api/admin/calendar-slots?from=${isoDate(0)}&to=${isoDate(14)}`, {
          admin: true,
        }),
      );
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function add(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/admin/calendar-slots', {
        admin: true,
        method: 'POST',
        body: { date, startTime, price: Number(price) },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slot');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await api(`/api/admin/calendar-slots/${id}`, { admin: true, method: 'DELETE' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
    await load();
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">Availability calendar</h2>
      <form onSubmit={add} className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Time">
          <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </Field>
        <Field label="Price (₫)">
          <TextInput inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-full">
            Add slot
          </Button>
        </div>
      </form>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <ul className="space-y-2">
        {slots.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-hairline bg-panel-2 px-4 py-2.5 text-sm"
          >
            <span>
              {s.date} · {s.startTime} · {formatVnd(s.price)} ·{' '}
              <span className="uppercase text-muted">{s.status}</span>
            </span>
            {s.status !== 'booked' && (
              <button onClick={() => remove(s.id)} className="text-muted hover:text-red-400">
                Delete
              </button>
            )}
          </li>
        ))}
        {slots.length === 0 && <li className="text-sm text-muted">No slots in the next two weeks.</li>}
      </ul>
    </section>
  );
}
