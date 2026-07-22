import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import { addDaysISO, formatLong, todayISO } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import type { CalendarSlot } from '../../types';
import { CornerBrackets } from '../ui';
import Calendar from '../booking/Calendar';

// Availability editor, Calendly-style: a month calendar (days with slots carry a
// dot) beside the chosen day's slots, with an inline add-time control. Loads a
// 180-day window so the calendar can mark availability without a per-month fetch.
export default function CalendarEditor() {
  const { lang } = useI18n();
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [price, setPrice] = useState('250000');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    try {
      setSlots(
        await api<CalendarSlot[]>(`/api/admin/calendar-slots?from=${todayISO()}&to=${addDaysISO(todayISO(), 180)}`, {
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

  const marked = new Set(slots.map((s) => s.date));
  const daySlots = slots
    .filter((s) => s.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section className="relative rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
      <CornerBrackets />
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Availability</h2>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Calendar selected={date} onSelect={setDate} marked={marked} />

        <div className="mt-6 border-t border-hairline pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="mb-3 font-semibold tabular-nums">{formatLong(date, lang)}</div>

          <form onSubmit={add} className="mb-4 flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">Time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-hairline bg-panel-2 px-2 py-2 text-sm tabular-nums text-ink outline-none focus:border-brand-to"
              />
            </label>
            <label className="w-20 shrink-0">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">Price ₫</span>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-hairline bg-panel-2 px-2 py-2 text-sm tabular-nums text-ink outline-none focus:border-brand-to"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              aria-label="Add slot"
              className="brand-gradient grid h-[38px] w-10 shrink-0 place-items-center rounded-lg text-xl font-bold leading-none text-on-accent transition disabled:opacity-60"
            >
              +
            </button>
          </form>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          {daySlots.length === 0 ? (
            <p className="text-sm text-muted">No slots on this day yet.</p>
          ) : (
            <ul className="flex max-h-[14rem] flex-col gap-2 overflow-y-auto pr-1">
              {daySlots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-sm"
                >
                  <span className="tabular-nums">
                    <span className="font-semibold">{s.startTime}</span>
                    <span className="text-muted"> · {formatVnd(s.price)}</span>
                  </span>
                  {s.status === 'booked' ? (
                    <span className="text-[10px] uppercase tracking-wide text-brand-from">booked</span>
                  ) : (
                    <button
                      onClick={() => remove(s.id)}
                      aria-label="Delete slot"
                      className="text-muted transition hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
