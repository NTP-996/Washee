import type { CalendarSlot } from '../../types';
import { formatLong } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import Calendar from './Calendar';

// Calendly-style two-pane picker: month calendar on the left, the chosen day's
// open times on the right (stacked on mobile). Only bookable (available) slots
// are shown, newest-time order as returned by the API.
export default function SlotPicker({
  date,
  slots,
  selectedId,
  loading = false,
  error = false,
  onRetry,
  onDateChange,
  onPick,
}: {
  date: string;
  slots: CalendarSlot[];
  selectedId: string | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onDateChange: (d: string) => void;
  onPick: (s: CalendarSlot) => void;
}) {
  const { lang, t, tf } = useI18n();
  const open = slots.filter((s) => s.status === 'available');

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
      <Calendar selected={date} onSelect={onDateChange} />

      <div className="mt-6 border-t border-hairline pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-widest text-muted">{t('slots.title')}</div>
          <div className="font-semibold tabular-nums">{formatLong(date, lang)}</div>
        </div>

        {/* Loading and error come first — the definitive "no open times" empty
            state must only show after a successful empty response, never while
            the request is in flight or after it failed. */}
        {loading ? (
          <p className="animate-pulse rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-muted">
            {t('slots.loading')}
          </p>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-muted"
          >
            <p>{t('slots.error')}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-full border border-hairline px-4 py-2 text-sm text-ink transition hover:border-brand-to"
            >
              {t('slots.retry')}
            </button>
          </div>
        ) : open.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-muted">
            {t('slots.empty1')}
            <br />
            {t('slots.empty2')}
          </p>
        ) : (
          <div className="flex max-h-[19.5rem] flex-col gap-2 overflow-y-auto pr-1">
            {open.map((s) => {
              const active = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onPick(s)}
                  className={`group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-3 text-left transition ${
                    active ? 'border-brand-to bg-panel-2' : 'border-hairline hover:border-brand-to'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 w-1 ${active ? 'speed-stripe' : ''}`}
                  />
                  <span className="pl-1">
                    <span className="block text-lg font-semibold leading-none tabular-nums">
                      {s.startTime}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {tf('duration', { minutes: s.durationMinutes })}
                    </span>
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      active
                        ? 'text-brand-from'
                        : 'text-muted opacity-0 transition group-hover:opacity-100'
                    }`}
                  >
                    {active ? t('slots.selected') : t('slots.select')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
