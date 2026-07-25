import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import type { AdminFeedItem, CompleteBookingResult } from '../../types';
import { pillButton, pillButtonActive } from './listControls';

type StatusFilter =
  | ''
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_payment'
  | 'declined'
  | 'completed'
  | 'cancelled';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Same non-terminal set the backend's admin.CompleteBooking guard allows as
// an override — matches ErrNotCompletable exactly (blocked only on
// cancelled/declined/already-completed).
const OVERRIDABLE_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

// Polls the admin booking feed every 8s (v1 recommendation — upgrade to SSE/WS later).
// Confirmed bookings can be marked completed, which triggers referral-coupon issuance.
export default function LiveBookingFeed({ onComplete }: { onComplete?: () => void }) {
  const [items, setItems] = useState<AdminFeedItem[]>([]);
  const [note, setNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  async function poll(): Promise<void> {
    try {
      setItems(await api<AdminFeedItem[]>('/api/admin/bookings', { admin: true }));
    } catch {
      /* ignore transient errors between polls */
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const data = await api<AdminFeedItem[]>('/api/admin/bookings', { admin: true }).catch(
        () => null,
      );
      if (active && data) setItems(data);
    })();
    const timer = setInterval(() => void poll(), 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function complete(id: string): Promise<void> {
    try {
      const res = await api<CompleteBookingResult>(`/api/admin/bookings/${id}/complete`, {
        admin: true,
        method: 'PATCH',
      });
      setNote(
        res.couponIssued ? 'Completed — a referral coupon was issued.' : 'Booking completed.',
      );
      setTimeout(() => setNote(''), 2500);
      await poll();
      onComplete?.();
    } catch {
      setNote('Could not complete that booking.');
      setTimeout(() => setNote(''), 2500);
    }
  }

  const visible = statusFilter ? items.filter((b) => b.status === statusFilter) : items;

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted">
        Live bookings <span className="h-2 w-2 animate-pulse rounded-full bg-brand-to" />
      </h2>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {statusFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={statusFilter === f.value ? pillButtonActive : pillButton}
          >
            {f.label}
          </button>
        ))}
      </div>

      {note && <p className="mb-3 text-sm text-brand-from">{note}</p>}
      {visible.length === 0 ? (
        <p className="text-sm text-muted">No bookings match.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {b.date} · {b.startTime}
                  <span className="font-normal text-muted"> · {b.driverName}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="uppercase text-muted">{b.status}</span>
                  {OVERRIDABLE_STATUSES.has(b.status) && (
                    <button
                      onClick={() => complete(b.id)}
                      className="text-xs text-brand-from hover:underline"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted">
                {b.userEmail} · {b.phoneNumber}
              </div>
              <div className="text-xs text-muted">
                {b.locationLabel}: {b.locationAddress} · {formatVnd(b.price)}
              </div>
              <div className="text-xs text-muted">
                {b.packageTitle} · {b.carTypeName}
              </div>
              {b.status === 'declined' && b.declineReason && (
                <div className="text-xs text-red-400">Declined: {b.declineReason}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
