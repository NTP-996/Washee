import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { formatVnd } from '../../lib/format';
import type { AdminSettings, AdminSettingsUpdateResult } from '../../types';
import { Button, Field, TextInput } from '../ui';

// The one platform-wide standard price. Driver slots inherit it on publish;
// changing it reprices open, future slots (booked ones keep their price).
export default function SettingsCard() {
  const [price, setPrice] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await api<AdminSettings>('/api/admin/settings', { admin: true });
        setPrice(settings.standardPriceVnd);
        setInput(String(settings.standardPriceVnd));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setNote('');
    setBusy(true);
    try {
      // Accept separator-formatted input ("300.000" / "300,000"): whole VND only.
      const res = await api<AdminSettingsUpdateResult>('/api/admin/settings', {
        admin: true,
        method: 'PATCH',
        body: { standardPriceVnd: Number(input.replace(/[.,\s]/g, '')) },
      });
      setPrice(res.standardPriceVnd);
      setInput(String(res.standardPriceVnd));
      setNote(`Repriced ${res.repricedSlots} open slot(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="settings" className="scroll-mt-20 rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">Standard price</h2>
      <div className="text-3xl font-extrabold tracking-tight tabular-nums">
        {price !== null ? formatVnd(price) : '—'}
      </div>
      <p className="mt-2 text-xs text-muted">
        Driver slots inherit this price. Changing it also updates open, future slots — booked ones
        keep their price.
      </p>

      <form onSubmit={save} className="mt-4 space-y-3">
        <Field label="New price (₫)">
          <TextInput
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
            className="tabular-nums"
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          Save
        </Button>
        {note && <p className="text-xs text-muted">{note}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </section>
  );
}
