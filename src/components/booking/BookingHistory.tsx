import type { Booking } from '../../types';
import { formatVnd } from '../../lib/format';
import { formatLong } from '../../lib/date';
import { useI18n } from '../../lib/i18n';

export default function BookingHistory({
  bookings,
  onCancel,
}: {
  bookings: Booking[];
  onCancel: (id: string) => void;
}) {
  const { lang, t } = useI18n();
  if (bookings.length === 0) return <p className="text-sm text-muted">{t('history.empty')}</p>;
  return (
    <ul className="space-y-2">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="flex items-center justify-between rounded-xl border border-hairline bg-panel-2 px-4 py-3"
        >
          <div>
            <div className="font-semibold tabular-nums">
              {formatLong(b.date, lang)} · {b.startTime}
            </div>
            <div className="text-xs text-muted">
              {formatVnd(b.price)} · <span className="uppercase">{t(`status.${b.status}`)}</span>
              {b.driverName && (
                <>
                  {' '}
                  · {t('history.washer')}: {b.driverName}
                </>
              )}
            </div>
          </div>
          {(b.status === 'confirmed' || b.status === 'pending') && (
            <button
              onClick={() => onCancel(b.id)}
              className="text-sm text-muted hover:text-red-400"
            >
              {t('history.cancel')}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
