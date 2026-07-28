import { useState } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import type { AdminNotifyResult } from '../../types';
import { pillButton, pillButtonActive } from './listControls';

const AUDIENCES = [
  { value: 'customers', label: 'Customers' },
  { value: 'drivers', label: 'Drivers' },
  { value: 'all', label: 'All' },
] as const;

type Audience = (typeof AUDIENCES)[number]['value'];

/** Compose-and-send push notifications to every registered mobile device of an
 *  audience. The result line is the delivery receipt from the push provider. */
export default function NotifyPanel() {
  const [audience, setAudience] = useState<Audience>('customers');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<AdminNotifyResult | null>(null);
  const [error, setError] = useState('');

  async function send(): Promise<void> {
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await api<AdminNotifyResult>('/api/admin/notifications', {
        method: 'POST',
        body: { audience, title: title.trim(), body: body.trim() },
        admin: true,
      });
      setResult(res);
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send the notification.');
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-hairline bg-panel-2 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-to';

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Send notification</h2>

      <div className="mb-3 flex gap-1.5">
        {AUDIENCES.map((a) => (
          <button
            key={a.value}
            onClick={() => setAudience(a.value)}
            className={audience === a.value ? pillButtonActive : pillButton}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Title"
          className={inputClass}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Message"
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="brand-gradient rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-on-accent disabled:opacity-40"
        >
          {sending ? 'Sending…' : 'Send push'}
        </button>
        {result && (
          <span className="text-xs text-muted">
            {result.devices} device{result.devices === 1 ? '' : 's'} · {result.sent} sent
            {result.failed > 0 && <span className="text-red-400"> · {result.failed} failed</span>}
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      <p className="mt-3 text-xs text-muted">
        Delivers to phones with the washee app installed and logged in. Customers, drivers, or
        everyone — sent immediately.
      </p>
    </section>
  );
}
