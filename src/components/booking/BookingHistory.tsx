import { useState } from 'react';
import type { Booking, ReviewSummary } from '../../types';
import { formatVnd } from '../../lib/format';
import { formatLong } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import { api, ApiRequestError } from '../../lib/api';
import { Button, StarRating } from '../ui';
import ChatPanel from './ChatPanel';

// A booking's chat stays open through the whole active wash — not just until
// confirmation — mirroring the backend's chat.Service `active()` guard.
const CHAT_ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

function ReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: (review: ReviewSummary) => void;
}) {
  const { t } = useI18n();
  const [washRating, setWashRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    if (washRating === 0 || driverRating === 0) return;
    setError('');
    setBusy(true);
    try {
      const review = await api<ReviewSummary>(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        body: { washRating, driverRating, comment: comment.trim() },
      });
      onSubmitted(review);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('review.errSubmit'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-hairline pt-3">
      <div className="text-xs uppercase tracking-widest text-muted">{t('review.rate')}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{t('review.wash')}</span>
        <StarRating
          value={washRating}
          onChange={setWashRating}
          size="sm"
          label={t('review.wash')}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{t('review.driver')}</span>
        <StarRating
          value={driverRating}
          onChange={setDriverRating}
          size="sm"
          label={t('review.driver')}
        />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('review.commentPlaceholder')}
        rows={2}
        className="w-full rounded-xl border border-hairline bg-panel px-3 py-2 text-sm text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to"
      />
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button
        onClick={submit}
        disabled={busy || washRating === 0 || driverRating === 0}
        className="px-4! py-2! text-sm"
      >
        {busy ? '…' : t('review.submit')}
      </Button>
    </div>
  );
}

function ReviewDisplay({ review }: { review: ReviewSummary }) {
  const { t, tf } = useI18n();
  return (
    <div className="mt-3 space-y-1.5 border-t border-hairline pt-3">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">{t('review.wash')}</span>
        <StarRating
          value={review.washRating}
          size="sm"
          label={tf('starsOutOf5', { n: review.washRating })}
        />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">{t('review.driver')}</span>
        <StarRating
          value={review.driverRating}
          size="sm"
          label={tf('starsOutOf5', { n: review.driverRating })}
        />
      </div>
      {review.comment && <p className="text-sm text-muted">&ldquo;{review.comment}&rdquo;</p>}
    </div>
  );
}

export default function BookingHistory({
  bookings,
  onCancel,
  onReviewed,
}: {
  bookings: Booking[];
  onCancel: (id: string) => void;
  onReviewed: (bookingId: string, review: ReviewSummary) => void;
}) {
  const { lang, t, tf } = useI18n();
  const [openChat, setOpenChat] = useState<string | null>(null);
  if (bookings.length === 0) return <p className="text-sm text-muted">{t('history.empty')}</p>;
  return (
    <ul className="space-y-2">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-xl border border-hairline bg-panel-2 px-4 py-3">
          <div className="flex items-center justify-between">
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
                    {b.driverRating.count > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                        <StarRating
                          value={Math.round(b.driverRating.driverAvg)}
                          size="sm"
                          label={tf('starsOutOf5', { n: Math.round(b.driverRating.driverAvg) })}
                        />
                        <span>({b.driverRating.count})</span>
                      </span>
                    )}
                  </>
                )}
              </div>
              {b.status === 'declined' && b.declineReason && (
                <div className="mt-1 text-xs text-red-400">
                  {t('history.declineReason')}: {b.declineReason}
                </div>
              )}
            </div>
            {(b.status === 'confirmed' || b.status === 'pending') && (
              <button
                onClick={() => onCancel(b.id)}
                className="text-sm text-muted hover:text-red-400"
              >
                {t('history.cancel')}
              </button>
            )}
          </div>

          {b.status === 'completed' &&
            (b.review ? (
              <ReviewDisplay review={b.review} />
            ) : (
              <ReviewForm bookingId={b.id} onSubmitted={(review) => onReviewed(b.id, review)} />
            ))}

          <button
            onClick={() => setOpenChat((prev) => (prev === b.id ? null : b.id))}
            className="mt-2 text-xs text-muted underline-offset-2 hover:text-brand-from hover:underline"
          >
            {t('history.messages')}
          </button>
          {openChat === b.id && (
            <ChatPanel
              bookingId={b.id}
              role="customer"
              active={CHAT_ACTIVE_STATUSES.has(b.status)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
