import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import type { AdminFeedItem } from '../../types';

// Polls the admin booking feed every 8s (v1 recommendation — upgrade to SSE/WS later).
export default function LiveBookingFeed() {
  const [items, setItems] = useState<AdminFeedItem[]>([]);

  useEffect(() => {
    let active = true;
    async function poll(): Promise<void> {
      try {
        const data = await api<AdminFeedItem[]>('/api/admin/bookings', { admin: true });
        if (active) setItems(data);
      } catch {
        /* ignore transient errors between polls */
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted">
        Live bookings <span className="h-2 w-2 animate-pulse rounded-full bg-brand-to" />
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No bookings yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={b.id} className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {b.date} · {b.startTime}
                </span>
                <span className="uppercase text-muted">{b.status}</span>
              </div>
              <div className="text-xs text-muted">
                {b.userEmail} · {b.phoneNumber}
              </div>
              <div className="text-xs text-muted">
                {b.locationLabel}: {b.locationAddress} · {formatVnd(b.price)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
