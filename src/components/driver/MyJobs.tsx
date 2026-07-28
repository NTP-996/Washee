import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import { formatLong } from '../../lib/date';
import { useI18n } from '../../lib/i18n';
import { useElapsed } from '../../lib/useElapsed';
import type { DriverJob } from '../../types';
import { CornerBrackets } from '../ui';
import ChatPanel from '../booking/ChatPanel';

const DECLINE_REASONS = ["I'm busy", 'On the road', 'On another job'] as const;

// A job stays visible to its own chat/messages toggle through the whole
// active wash — not just until confirmation — mirroring the backend's
// chat.Service `active()` guard exactly.
const CHAT_ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

interface ActionResult {
  status: string;
  declineReason?: string;
  startedAt?: string;
  finishedAt?: string;
}

function JobTimer({ startedAt }: { startedAt: string }) {
  const elapsed = useElapsed(startedAt);
  return <span className="font-semibold tabular-nums text-brand-from">{elapsed}</span>;
}

// The driver's job sheet: bookings placed against their published slots, with
// the customer's phone one tap away. A "pending" job needs the driver to
// confirm or decline (with a reason); a "confirmed" job is started on
// arrival (a single action — no separate "arrived" step); "in_progress"
// shows a live timer until the driver marks it done; "awaiting_payment"
// waits on the driver to confirm the cash handoff.
export default function MyJobs() {
  const { lang } = useI18n();
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineOpenId, setDeclineOpenId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineOther, setDeclineOther] = useState('');
  const [openChat, setOpenChat] = useState<string | null>(null);

  async function load(): Promise<void> {
    setActionError('');
    try {
      setJobs(await api<DriverJob[]>('/api/driver/bookings', { driver: true }));
    } catch {
      setActionError('Failed to load jobs');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function patchJob(id: string, res: ActionResult): void {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: res.status,
              declineReason: res.declineReason ?? j.declineReason,
              startedAt: res.startedAt ?? j.startedAt,
              finishedAt: res.finishedAt ?? j.finishedAt,
            }
          : j,
      ),
    );
  }

  async function runAction(jobId: string, action: string, failMessage: string): Promise<void> {
    setActionError('');
    setBusyId(jobId);
    try {
      const res = await api<ActionResult>(`/api/driver/bookings/${jobId}/${action}`, {
        driver: true,
        method: 'POST',
      });
      patchJob(jobId, res);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : failMessage);
    } finally {
      setBusyId(null);
    }
  }

  const confirm = (jobId: string): Promise<void> =>
    runAction(jobId, 'confirm', 'Could not confirm this job');
  const startJob = (jobId: string): Promise<void> =>
    runAction(jobId, 'start', 'Could not start this job');
  const finishJob = (jobId: string): Promise<void> =>
    runAction(jobId, 'finish', 'Could not finish this job');
  const confirmPayment = (jobId: string): Promise<void> =>
    runAction(jobId, 'confirm-payment', 'Could not confirm payment');

  function openDecline(jobId: string): void {
    setDeclineOpenId((prev) => (prev === jobId ? null : jobId));
    setDeclineReason('');
    setDeclineOther('');
  }

  async function decline(jobId: string): Promise<void> {
    const reason = (declineReason === 'Other' ? declineOther : declineReason).trim();
    if (!reason) return;
    setActionError('');
    setBusyId(jobId);
    try {
      const res = await api<ActionResult>(`/api/driver/bookings/${jobId}/decline`, {
        driver: true,
        method: 'POST',
        body: { reason },
      });
      patchJob(jobId, res);
      setDeclineOpenId(null);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : 'Could not decline this job');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="relative rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
      <CornerBrackets />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted">Job sheet</h2>
        <button
          onClick={() => void load()}
          className="min-h-11 rounded-full border border-hairline px-4 py-2 text-xs text-muted transition hover:border-brand-to hover:text-ink"
        >
          Refresh
        </button>
      </div>
      {actionError && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {actionError}
        </p>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-muted">
          No jobs yet — publish hours above and bookings will appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-xl border border-hairline bg-panel-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold tabular-nums">
                  {formatLong(j.date, lang)} · {j.startTime}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    j.status === 'confirmed' ||
                    j.status === 'in_progress' ||
                    j.status === 'awaiting_payment'
                      ? 'border-brand-to/40 text-brand-from'
                      : 'border-hairline text-muted'
                  }`}
                >
                  {j.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {j.locationLabel} — {j.locationAddress}
              </p>
              <p className="mt-1 text-sm text-muted">
                {j.packageTitle} · {j.carTypeName}
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <a href={`tel:${j.phoneNumber}`} className="tabular-nums text-brand-from">
                  {j.phoneNumber}
                </a>
                <span className="font-semibold tabular-nums">{formatVnd(j.price)}</span>
              </div>

              {j.status === 'declined' && j.declineReason && (
                <p className="mt-2 text-xs text-red-400">You declined: {j.declineReason}</p>
              )}
              {j.status === 'in_progress' && j.startedAt && (
                <p className="mt-2 text-sm text-muted">
                  Elapsed: <JobTimer startedAt={j.startedAt} />
                </p>
              )}

              {j.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => void confirm(j.id)}
                    disabled={busyId === j.id}
                    className="min-h-11 rounded-full border border-brand-to/40 px-5 py-2.5 text-sm text-brand-from transition hover:brightness-110 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => openDecline(j.id)}
                    disabled={busyId === j.id}
                    className="min-h-11 rounded-full border border-hairline px-5 py-2.5 text-sm text-muted transition hover:border-red-400/60 hover:text-red-400 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
              {j.status === 'confirmed' && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => void startJob(j.id)}
                    disabled={busyId === j.id}
                    className="min-h-11 rounded-full border border-brand-to/40 px-5 py-2.5 text-sm text-brand-from transition hover:brightness-110 disabled:opacity-50"
                  >
                    Start Job
                  </button>
                </div>
              )}
              {j.status === 'in_progress' && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => void finishJob(j.id)}
                    disabled={busyId === j.id}
                    className="min-h-11 rounded-full border border-brand-to/40 px-5 py-2.5 text-sm text-brand-from transition hover:brightness-110 disabled:opacity-50"
                  >
                    Job Done
                  </button>
                </div>
              )}
              {j.status === 'awaiting_payment' && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => void confirmPayment(j.id)}
                    disabled={busyId === j.id}
                    className="min-h-11 rounded-full border border-brand-to/40 px-5 py-2.5 text-sm text-brand-from transition hover:brightness-110 disabled:opacity-50"
                  >
                    Confirm {formatVnd(j.price)} Received
                  </button>
                </div>
              )}
              {declineOpenId === j.id && (
                <div className="mt-3 space-y-2 border-t border-hairline pt-3">
                  <p className="text-xs uppercase tracking-widest text-muted">
                    Reason for declining
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...DECLINE_REASONS, 'Other'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setDeclineReason(reason)}
                        aria-pressed={declineReason === reason}
                        className={`min-h-11 rounded-full border px-4 py-2 text-xs transition ${
                          declineReason === reason
                            ? 'border-brand-to/60 text-brand-from'
                            : 'border-hairline text-muted hover:border-brand-to'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {declineReason === 'Other' && (
                    <textarea
                      value={declineOther}
                      onChange={(e) => setDeclineOther(e.target.value)}
                      placeholder="Tell the customer why…"
                      rows={2}
                      className="w-full rounded-xl border border-hairline bg-panel px-3 py-2 text-sm text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to"
                    />
                  )}
                  <button
                    onClick={() => void decline(j.id)}
                    disabled={
                      busyId === j.id ||
                      !declineReason ||
                      (declineReason === 'Other' && !declineOther.trim())
                    }
                    className="min-h-11 rounded-full border border-red-400/60 px-5 py-2.5 text-sm text-red-400 transition hover:brightness-110 disabled:opacity-50"
                  >
                    Send decline
                  </button>
                </div>
              )}

              <button
                onClick={() => setOpenChat((prev) => (prev === j.id ? null : j.id))}
                aria-expanded={openChat === j.id}
                className="mt-1 block min-h-11 py-2.5 text-xs text-muted underline-offset-2 hover:text-brand-from hover:underline"
              >
                Messages
              </button>
              {openChat === j.id && (
                <ChatPanel
                  bookingId={j.id}
                  role="driver"
                  active={CHAT_ACTIVE_STATUSES.has(j.status)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
