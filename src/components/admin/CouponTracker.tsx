import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PAGE_LIMIT, useAdminPagedList } from '../../lib/useAdminPagedList';
import type { AdminCoupon, AdminCouponSummary } from '../../types';
import { DateRangeFilter, LoadMoreButton, pillButton } from './listControls';

type Filter = 'all' | 'available' | 'redeemed' | 'expired';
const FILTERS: Filter[] = ['all', 'available', 'redeemed', 'expired'];

const STATUS_STYLE: Record<string, string> = {
  available: 'text-brand-from',
  redeemed: 'text-muted',
  expired: 'text-red-400',
};

export default function CouponTracker({ refreshKey = 0 }: { refreshKey?: number }) {
  const [summary, setSummary] = useState<AdminCouponSummary | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [voidError, setVoidError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  useEffect(() => {
    api<AdminCouponSummary>('/api/admin/coupons/summary', { admin: true })
      .then(setSummary)
      .catch(() => undefined);
  }, [refreshKey]);

  const fetchPage = useCallback(
    (before: string) => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT + 1) });
      if (filter !== 'all') params.set('status', filter);
      if (appliedFrom) params.set('from', appliedFrom);
      if (appliedTo) params.set('to', appliedTo);
      if (before) params.set('before', before);
      return api<AdminCoupon[]>(`/api/admin/coupons?${params}`, { admin: true });
    },
    [filter, appliedFrom, appliedTo],
  );
  const {
    items: coupons,
    hasMore,
    loadingMore,
    error,
    reload,
    loadMore,
  } = useAdminPagedList(fetchPage, (c) => c.createdAt);

  // refreshKey ticks when a booking is completed elsewhere on the dashboard
  // (a completion may have just issued a referral coupon) — refetch this
  // panel's first page without disturbing the user's current filter.
  useEffect(() => {
    if (refreshKey > 0) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  function applyDateRange(): void {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  async function voidCoupon(id: string): Promise<void> {
    const reason = window.prompt('Reason for voiding this coupon?');
    if (!reason || !reason.trim()) return;
    setVoidError('');
    try {
      await api(`/api/admin/coupons/${id}/void`, {
        admin: true,
        method: 'PATCH',
        body: { reason },
      });
      await reload();
    } catch (err) {
      setVoidError(err instanceof Error ? err.message : 'Could not void the coupon');
    }
  }

  const cards: [string, number | undefined][] = [
    ['Total', summary?.totalCreated],
    ['Available', summary?.available],
    ['Redeemed', summary?.redeemed],
    ['Expired', summary?.expired],
  ];

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">Referral coupons</h2>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {cards.map(([label, n]) => (
          <div
            key={label}
            className="rounded-xl border border-hairline bg-panel-2 px-3 py-3 text-center"
          >
            <div className="text-2xl font-bold tabular-nums">{n ?? '—'}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                filter === f ? 'border-brand-to bg-panel-2 text-ink' : 'border-hairline text-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <button onClick={applyDateRange} className={`${pillButton} shrink-0 px-4 py-2`}>
          Apply
        </button>
      </div>

      {(error || voidError) && <p className="mb-3 text-sm text-red-400">{error || voidError}</p>}

      {coupons.length === 0 ? (
        <p className="text-sm text-muted">No coupons in this view.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {c.discountPercent}% off → {c.ownerEmail}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`uppercase ${STATUS_STYLE[c.status] ?? 'text-muted'}`}>
                    {c.status}
                  </span>
                  {c.status === 'available' && (
                    <button
                      onClick={() => void voidCoupon(c.id)}
                      className="text-xs text-muted hover:text-red-400"
                    >
                      Void
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted">
                Earned from {c.sourceBooking.refereeEmail}&apos;s wash · {c.sourceBooking.slotDate}{' '}
                {c.sourceBooking.slotStartTime}
              </div>
              {c.redeemedBooking && (
                <div className="text-xs text-muted">
                  Applied to {c.redeemedBooking.slotDate} {c.redeemedBooking.slotStartTime}
                </div>
              )}
              {c.voidReason && (
                <div className="text-xs text-red-400/80">
                  Voided by {c.voidedByAdminUsername}: {c.voidReason}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <LoadMoreButton hasMore={hasMore} loadingMore={loadingMore} onClick={() => void loadMore()} />
    </section>
  );
}
