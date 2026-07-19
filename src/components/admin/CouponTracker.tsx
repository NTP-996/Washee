import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminCoupon, AdminCouponSummary } from '../../types';

type Filter = 'all' | 'available' | 'redeemed' | 'expired';
const FILTERS: Filter[] = ['all', 'available', 'redeemed', 'expired'];

const STATUS_STYLE: Record<string, string> = {
  available: 'text-brand-from',
  redeemed: 'text-muted',
  expired: 'text-red-400',
};

export default function CouponTracker({ refreshKey = 0 }: { refreshKey?: number }) {
  const [summary, setSummary] = useState<AdminCouponSummary | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async (f: Filter): Promise<void> => {
    const qs = f === 'all' ? '' : `?status=${f}`;
    try {
      const [s, list] = await Promise.all([
        api<AdminCouponSummary>('/api/admin/coupons/summary', { admin: true }),
        api<AdminCoupon[]>(`/api/admin/coupons${qs}`, { admin: true }),
      ]);
      setSummary(s);
      setCoupons(list);
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, refreshKey, load]);

  async function voidCoupon(id: string): Promise<void> {
    const reason = window.prompt('Reason for voiding this coupon?');
    if (!reason || !reason.trim()) return;
    try {
      await api(`/api/admin/coupons/${id}/void`, { admin: true, method: 'PATCH', body: { reason } });
      await load(filter);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not void the coupon');
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
          <div key={label} className="rounded-xl border border-hairline bg-panel-2 px-3 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums">{n ?? '—'}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1.5">
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

      {coupons.length === 0 ? (
        <p className="text-sm text-muted">No coupons in this view.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li key={c.id} className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {c.discountPercent}% off → {c.ownerEmail}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`uppercase ${STATUS_STYLE[c.status] ?? 'text-muted'}`}>{c.status}</span>
                  {c.status === 'available' && (
                    <button onClick={() => voidCoupon(c.id)} className="text-xs text-muted hover:text-red-400">
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
    </section>
  );
}
