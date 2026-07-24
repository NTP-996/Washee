import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { passkeySupported, registerPasskey } from '../../lib/webauthn';
import { formatLong } from '../../lib/date';

interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// Passkey management: register Face ID / fingerprint / device-PIN credentials
// and remove them. Only shown when the browser supports WebAuthn.
export default function PasskeysCard() {
  const { t, lang } = useI18n();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const supported = passkeySupported();

  async function load(): Promise<void> {
    try {
      setPasskeys(await api<Passkey[]>('/api/auth/passkey/credentials'));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    if (supported) void load();
  }, [supported]);

  async function add(): Promise<void> {
    setError('');
    setNote('');
    setBusy(true);
    try {
      const label = window.navigator.platform || 'Passkey';
      if (await registerPasskey(label)) {
        setNote(t('passkey.added'));
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.passkeyFail'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    await api(`/api/auth/passkey/credentials/${id}`, { method: 'DELETE' }).catch(() => undefined);
    await load();
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="text-sm uppercase tracking-widest text-muted">{t('passkey.title')}</h2>
      <p className="mb-4 mt-1 text-sm text-muted">{t('passkey.subtitle')}</p>

      {!supported ? (
        <p className="text-sm text-muted">{t('passkey.unsupported')}</p>
      ) : (
        <>
          {passkeys.length === 0 ? (
            <p className="mb-4 text-sm text-muted">{t('passkey.none')}</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {passkeys.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-semibold">{p.name || 'Passkey'}</span>
                    <span className="ml-2 text-xs text-muted">{formatLong(p.createdAt, lang)}</span>
                  </span>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-sm text-muted transition hover:text-red-400"
                  >
                    {t('passkey.remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          {note && <p className="mb-3 text-sm text-brand-from">{note}</p>}
          <button
            onClick={add}
            disabled={busy}
            className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-to disabled:opacity-60"
          >
            {busy ? '…' : `+ ${t('passkey.add')}`}
          </button>
        </>
      )}
    </section>
  );
}
