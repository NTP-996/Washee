import { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { formatMonth, monthGrid, todayISO, weekdayLabels } from '../../lib/date';

// A month calendar. The single selected day carries the brand gradient — the
// one chromatic focal point per the design system; everything else stays quiet.
export default function Calendar({
  selected,
  onSelect,
  min = todayISO(),
  marked,
}: {
  selected: string;
  onSelect: (iso: string) => void;
  min?: string;
  marked?: Set<string>; // days to flag with an availability dot
}) {
  const { lang, t } = useI18n();
  const [sy, sm] = selected.split('-').map(Number);
  const [view, setView] = useState<{ y: number; m: number }>({ y: sy, m: sm - 1 });

  const today = todayISO();
  const weeks = monthGrid(view.y, view.m);
  const labels = weekdayLabels(lang);
  const [minY, minM] = min.split('-').map(Number);
  const canPrev = view.y > minY || (view.y === minY && view.m > minM - 1);

  const shift = (delta: number): void =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const navBtn =
    'grid h-11 w-11 place-items-center rounded-lg border border-hairline text-muted transition hover:border-brand-to hover:text-ink disabled:opacity-30 disabled:hover:border-hairline disabled:hover:text-muted';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label={t('cal.prevMonth')}
          className={navBtn}
        >
          ‹
        </button>
        <div className="text-sm font-semibold tracking-tight tabular-nums">
          {formatMonth(view.y, view.m, lang)}
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={t('cal.nextMonth')}
          className={navBtn}
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {labels.map((l, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            {l}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((iso, i) => {
          if (!iso) return <div key={i} />;
          const past = iso < min;
          const isSel = iso === selected;
          const isToday = iso === today;
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => onSelect(iso)}
              aria-label={iso}
              aria-current={isSel ? 'date' : undefined}
              className={[
                'relative flex aspect-square items-center justify-center rounded-lg text-sm tabular-nums transition',
                past ? 'cursor-not-allowed text-muted/25' : 'text-ink',
                isSel ? 'brand-gradient font-semibold text-on-accent' : '',
                !isSel && !past ? 'hover:bg-panel-2' : '',
                !isSel && isToday ? 'ring-1 ring-inset ring-brand-from/50' : '',
              ].join(' ')}
            >
              {Number(iso.slice(8))}
              {marked?.has(iso) && !isSel && (
                <span className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto h-1 w-1 rounded-full bg-brand-to" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
