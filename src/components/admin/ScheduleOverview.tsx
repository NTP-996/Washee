import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import { addDaysISO, formatLong, todayISO } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import type { CalendarSlot } from '../../types';
import { CornerBrackets } from '../ui';
import Calendar from '../booking/Calendar';

// Read-only schedule overview across all drivers. Drivers publish their own
// availability from the driver portal; admin only observes, with a delete
// escape hatch on non-booked slots for ops cleanup. Loads a 180-day window so
// the calendar can mark availability without a per-month fetch.
export default function ScheduleOverview() {
  const { lang } = useI18n();
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

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

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Delete this slot? The driver loses this availability.')) return;
    setError('');
    try {
      await api(`/api/admin/calendar-slots/${id}`, { admin: true, method: 'DELETE' });
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'slot_booked') {
        setError('That slot is booked and can no longer be deleted.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete');
      }
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
      <h2 className="mb-1 text-xs uppercase tracking-widest text-muted">Schedule</h2>
      <p className="mb-4 text-xs text-muted">
        Drivers publish their own availability — this view is read-only.
      </p>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Calendar selected={date} onSelect={setDate} marked={marked} />

        <div className="mt-6 border-t border-hairline pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="mb-3 font-semibold tabular-nums">{formatLong(date, lang)}</div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          {daySlots.length === 0 ? (
            <p className="text-sm text-muted">No slots on this day.</p>
          ) : (
            <ul className="flex max-h-[16rem] flex-col gap-2 overflow-y-auto pr-1">
              {daySlots.map((s) => (
                <li key={s.id} className="rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular-nums">
                      <span className="font-semibold">{s.startTime}</span>
                      <span className="text-muted"> · {formatVnd(s.price)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          s.status === 'booked' ? 'text-brand-from' : 'text-muted'
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.status !== 'booked' && (
                        <button
                          onClick={() => void remove(s.id)}
                          aria-label="Delete slot"
                          className="text-muted transition hover:text-red-400"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  </div>
                  {s.driverName && <div className="mt-0.5 text-xs text-muted">{s.driverName}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
