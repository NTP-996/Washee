import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { ReferralSummary } from '../../types';

// Referral share link (from GET /api/users/me/referral) + earned coupons.
export default function ReferralCard() {
  const [ref, setRef] = useState<ReferralSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<ReferralSummary>('/api/users/me/referral')
      .then(setRef)
      .catch(() => undefined);
  }, []);

  function copy(): void {
    if (!ref) return;
    navigator.clipboard.writeText(ref.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-6">
      <h2 className="mb-1 text-sm uppercase tracking-widest text-muted">Your referral link</h2>
      <p className="mb-4 text-sm text-muted">A friend&apos;s first wash earns you 50% off.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-xl border border-hairline bg-panel-2 px-3 py-2.5 text-sm text-brand-from">
          {ref?.shareUrl ?? '…'}
        </code>
        <button
          onClick={copy}
          disabled={!ref}
          className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-[color:var(--color-on-accent)] disabled:opacity-60"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs uppercase tracking-widest text-muted">Coupons</h3>
        {ref && ref.coupons.length > 0 ? (
          <ul className="space-y-2">
            {ref.coupons.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-hairline bg-panel-2 px-3 py-2 text-sm"
              >
                <span>{c.discountPercent}% off</span>
                <span className="text-muted">{c.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No coupons yet — share your link to earn one.</p>
        )}
      </div>
    </section>
  );
}
