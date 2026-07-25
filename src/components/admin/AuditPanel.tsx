import { useCallback, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { PAGE_LIMIT, useAdminPagedList } from '../../lib/useAdminPagedList';
import type { AuditLogRow } from '../../types';
import { TextInput } from '../ui';
import { DateRangeFilter, LoadMoreButton, pillButton, pillButtonActive } from './listControls';

type ActorFilter = '' | 'admin' | 'driver';

const actorFilters: { value: ActorFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'driver', label: 'Driver' },
];

// Read-only trail of privileged actions (admin logins, driver/slot mutations,
// …), newest first. Filterable by actor type, action prefix, and date range.
export default function AuditPanel() {
  const [actorType, setActorType] = useState<ActorFilter>('');
  const [actionPrefix, setActionPrefix] = useState('');
  const [appliedPrefix, setAppliedPrefix] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const fetchPage = useCallback(
    (before: string) => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT + 1) });
      if (actorType) params.set('actorType', actorType);
      if (appliedPrefix.trim()) params.set('actionPrefix', appliedPrefix.trim());
      if (appliedFrom) params.set('from', appliedFrom);
      if (appliedTo) params.set('to', appliedTo);
      if (before) params.set('before', before);
      return api<AuditLogRow[]>(`/api/admin/audit-logs?${params}`, { admin: true });
    },
    [actorType, appliedPrefix, appliedFrom, appliedTo],
  );
  const {
    items: rows,
    hasMore,
    loadingMore,
    error,
    loadMore,
  } = useAdminPagedList(fetchPage, (r) => r.occurredAt);

  function pickActor(actor: ActorFilter): void {
    setActorType(actor);
  }

  function apply(e: FormEvent): void {
    e.preventDefault();
    setAppliedPrefix(actionPrefix);
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Audit trail</h2>

      <form onSubmit={apply} className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 gap-1.5">
          {actorFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => pickActor(f.value)}
              className={actorType === f.value ? pillButtonActive : pillButton}
            >
              {f.label}
            </button>
          ))}
        </div>
        <TextInput
          value={actionPrefix}
          onChange={(e) => setActionPrefix(e.target.value)}
          placeholder="Action prefix (e.g. admin.driver)"
          aria-label="Filter by action prefix"
          className="min-w-40 flex-1 px-3! py-2! text-sm"
        />
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <button type="submit" className={`${pillButton} shrink-0 px-4 py-2`}>
          Apply
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No audit entries match.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const entity =
              r.entityType != null && r.entityType !== ''
                ? `${r.entityType}${r.entityId ? ` ${r.entityId.slice(0, 8)}` : ''}`
                : null;
            const detailJson = Object.keys(r.detail).length > 0 ? JSON.stringify(r.detail) : null;
            return (
              <li
                key={r.id}
                className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-xs tabular-nums text-muted">
                    {new Date(r.occurredAt).toLocaleString()}
                  </span>
                  <span className="font-semibold">{r.action}</span>
                  <span className="text-xs text-muted">
                    {r.actorLabel ?? (r.actorId ? r.actorId.slice(0, 8) : r.actorType)}
                  </span>
                </div>
                {(entity !== null || r.ip) && (
                  <div className="mt-1 text-xs text-muted">
                    {[entity, r.ip].filter(Boolean).join(' · ')}
                  </div>
                )}
                {detailJson !== null && (
                  <div className="mt-1 truncate text-xs text-muted" title={detailJson}>
                    {detailJson}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <LoadMoreButton hasMore={hasMore} loadingMore={loadingMore} onClick={() => void loadMore()} />
    </section>
  );
}
