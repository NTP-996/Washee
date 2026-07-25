import { useCallback, useState } from 'react';
import { api } from '../../lib/api';
import { PAGE_LIMIT, useAdminPagedList } from '../../lib/useAdminPagedList';
import type { AdminReviewRow } from '../../types';
import { StarRating } from '../ui';
import { LoadMoreButton, pillButton, pillButtonActive } from './listControls';

// Read-only admin view of every submitted review, newest first, filterable by
// driver full name (client-side — the roster is small enough not to need a
// server-side driver picker yet).
export default function ReviewsPanel() {
  const [driverFilter, setDriverFilter] = useState('');

  const fetchPage = useCallback(
    (before: string) =>
      api<AdminReviewRow[]>(
        `/api/admin/reviews?before=${encodeURIComponent(before)}&limit=${PAGE_LIMIT + 1}`,
        { admin: true },
      ),
    [],
  );
  const { items, hasMore, loadingMore, error, loadMore } = useAdminPagedList(
    fetchPage,
    (r) => r.createdAt,
  );

  const driverNames = Array.from(new Set(items.map((r) => r.driverName))).sort();
  const visible = driverFilter ? items.filter((r) => r.driverName === driverFilter) : items;

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Reviews</h2>

      {driverNames.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setDriverFilter('')}
            className={driverFilter === '' ? pillButtonActive : pillButton}
          >
            All
          </button>
          {driverNames.map((name) => (
            <button
              key={name}
              onClick={() => setDriverFilter(name)}
              className={driverFilter === name ? pillButtonActive : pillButton}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {visible.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.driverName}</span>
                <span className="text-xs tabular-nums text-muted">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">{r.customerEmail}</div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-2 text-xs text-muted">
                  Wash <StarRating value={r.washRating} size="sm" />
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  Driver <StarRating value={r.driverRating} size="sm" />
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted">&ldquo;{r.comment}&rdquo;</p>}
            </li>
          ))}
        </ul>
      )}

      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        onClick={() => void loadMore()}
        className="mt-4"
      />
    </section>
  );
}
