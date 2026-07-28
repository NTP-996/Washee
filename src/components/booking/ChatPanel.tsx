import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useBookingLive, type BookingLiveMessage } from '../../lib/useBookingLive';

// A booking's chat stays open through the whole active wash (pending through
// awaiting payment) — mirrors the backend's chat.Service `active()` guard.
const CHAT_ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

// A lightweight in-booking thread between the customer and their assigned
// driver. Open through the whole active wash; once it's declined, cancelled,
// or completed the input disables and a send attempt would 409 anyway.
// `active` is the parent's best-known state at mount/render time, but
// while this panel is open it also tracks live status events itself — so a
// decline/cancel/complete that happens while a customer or driver is sitting
// in an open chat locks it immediately, not just after the parent's own list
// next reloads.
export default function ChatPanel({
  bookingId,
  role,
  active,
}: {
  bookingId: string;
  role: 'customer' | 'driver';
  active: boolean;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<BookingLiveMessage[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveActive, setLiveActive] = useState(active);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const opts = role === 'driver' ? { driver: true } : {};
  const path =
    role === 'driver'
      ? `/api/driver/bookings/${bookingId}/messages`
      : `/api/bookings/${bookingId}/messages`;

  useEffect(() => {
    setLiveActive(active);
  }, [active]);

  useEffect(() => {
    setMessages([]);
    let ignore = false;
    api<BookingLiveMessage[]>(path, opts)
      .then((history) => {
        if (!ignore) setMessages(history);
      })
      .catch(() => {
        if (!ignore) setError('Failed to load messages');
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useBookingLive(bookingId, role, (ev) => {
    if (ev.type === 'chat' && ev.message) {
      const incoming = ev.message;
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    }
    if (ev.type === 'status' && ev.status) {
      setLiveActive(CHAT_ACTIVE_STATUSES.has(ev.status));
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  async function send(e: FormEvent): Promise<void> {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError('');
    setBusy(true);
    try {
      const sent = await api<BookingLiveMessage>(path, {
        ...opts,
        method: 'POST',
        body: { body: text },
      });
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setBody('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send message');
    } finally {
      setBusy(false);
    }
  }

  // Screen-reader sender prefix — bubble alignment/tint alone doesn't convey
  // who said what. Localized on the customer surface; the driver surface stays
  // English like the rest of the driver dashboard.
  function senderPrefix(senderRole: string): string {
    if (senderRole === role) return role === 'customer' ? t('chat.you') : 'You: ';
    return role === 'customer' ? t('chat.driver') : 'Customer: ';
  }

  return (
    <div className="mt-3 space-y-2 border-t border-hairline pt-3">
      <div
        role="log"
        aria-live="polite"
        aria-label={role === 'customer' ? t('history.messages') : 'Messages'}
        className="max-h-48 space-y-1.5 overflow-y-auto"
      >
        {messages.length === 0 && <p className="text-xs text-muted">No messages yet.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl border px-3 py-1.5 text-sm ${
              m.senderRole === role
                ? 'ml-auto border-brand-to/30 bg-panel-2 text-ink'
                : 'border-hairline bg-panel text-ink'
            }`}
          >
            <span className="sr-only">{senderPrefix(m.senderRole)}</span>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      {liveActive ? (
        <form onSubmit={send} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-xl border border-hairline bg-panel-2 px-3 py-2 text-sm text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-full border border-hairline px-4 py-2 text-sm text-muted transition hover:border-brand-to hover:text-ink disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted">This chat is closed.</p>
      )}
    </div>
  );
}
