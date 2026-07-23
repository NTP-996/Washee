import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import { formatLong } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import type { DriverJob } from '../../types';
import { CornerBrackets } from '../ui';

// The driver's job sheet: bookings placed against their published slots, with
// the customer's phone one tap away.
export default function MyJobs() {
  const { lang } = useI18n();
  const [jobs, setJobs] = useState<DriverJob[]>([]);

  async function load(): Promise<void> {
    try {
      setJobs(await api<DriverJob[]>('/api/driver/bookings', { driver: true }));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="relative rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
      <CornerBrackets />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted">Job sheet</h2>
        <button
          onClick={() => void load()}
          className="rounded-full border border-hairline px-3 py-1 text-xs text-muted transition hover:border-brand-to hover:text-ink"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-muted">
          No jobs yet — publish hours above and bookings will appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-xl border border-hairline bg-panel-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold tabular-nums">
                  {formatLong(j.date, lang)} · {j.startTime}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    j.status === 'confirmed'
                      ? 'border-brand-to/40 text-brand-from'
                      : 'border-hairline text-muted'
                  }`}
                >
                  {j.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {j.locationLabel} — {j.locationAddress}
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <a href={`tel:${j.phoneNumber}`} className="tabular-nums text-brand-from">
                  {j.phoneNumber}
                </a>
                <span className="font-semibold tabular-nums">{formatVnd(j.price)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
