import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { AuditLogRow } from '../../types';
import { TextInput } from '../ui';

const pillButton =
  'rounded-full border border-hairline px-2.5 py-1 text-xs text-muted transition hover:border-brand-to hover:text-ink';
const pillButtonActive =
  'rounded-full border border-brand-to px-2.5 py-1 text-xs text-ink transition';

type ActorFilter = '' | 'admin' | 'driver';

const actorFilters: { value: ActorFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'driver', label: 'Driver' },
];

// Read-only trail of privileged actions (admin logins, driver/slot mutations,
// …), newest first. Filterable by actor type and action prefix.
export default function AuditPanel() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [actorType, setActorType] = useState<ActorFilter>('');
  const [actionPrefix, setActionPrefix] = useState('');
  const [error, setError] = useState('');

  async function load(actor: ActorFilter, prefix: string): Promise<void> {
    setError('');
    try {
      const params = new URLSearchParams();
      if (actor) params.set('actorType', actor);
      if (prefix.trim()) params.set('actionPrefix', prefix.trim());
      const qs = params.toString();
      setRows(
        await api<AuditLogRow[]>(`/api/admin/audit-logs${qs ? `?${qs}` : ''}`, { admin: true }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    }
  }
  useEffect(() => {
    void load('', '');
  }, []);

  function pickActor(actor: ActorFilter): void {
    setActorType(actor);
    void load(actor, actionPrefix);
  }

  function apply(e: FormEvent): void {
    e.preventDefault();
    void load(actorType, actionPrefix);
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
    </section>
  );
}
