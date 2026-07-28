// Small primitives shared by the admin dashboard's list panels (Customers,
// Drivers, Coupons, Audit, Reviews, Packages). Kept separate from ../ui.tsx,
// which is page-agnostic (Button/Field/TextInput/StarRating are also used on
// customer-facing pages) — these are admin-list-specific.

export const pillButton =
  'rounded-full border border-hairline px-2.5 py-1 text-xs text-muted transition hover:border-brand-to hover:text-ink';
export const pillButtonActive =
  'rounded-full border border-brand-to px-2.5 py-1 text-xs text-ink transition';

export function LoadMoreButton({
  hasMore,
  loadingMore,
  onClick,
  className = 'mt-3',
}: {
  hasMore: boolean;
  loadingMore: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (!hasMore) return null;
  return (
    <button onClick={onClick} disabled={loadingMore} className={`${pillButton} ${className}`}>
      {loadingMore ? '…' : 'Load more'}
    </button>
  );
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        aria-label="From date"
        className="rounded-full border border-hairline bg-panel-2 px-3 py-1.5 text-xs text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to"
      />
      <span className="text-xs text-muted">–</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        aria-label="To date"
        className="rounded-full border border-hairline bg-panel-2 px-3 py-1.5 text-xs text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to"
      />
    </div>
  );
}
