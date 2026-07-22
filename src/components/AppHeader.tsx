import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

// The one top bar for every app route (booking / profile / admin / auth). The
// container width, lockup, and pill styles are fixed here so the brand never
// shifts or restyles between pages; only the landing keeps its marketing nav.
export const headerPill =
  'rounded-full border border-hairline px-4 py-2 text-sm transition hover:border-brand-to';

export default function AppHeader({ sub, children }: { sub?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/washee-mark.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold lowercase tracking-tight">
            washee{sub && <span className="font-normal text-muted"> · {sub}</span>}
          </span>
        </Link>
        {children && <nav className="flex items-center gap-2">{children}</nav>}
      </div>
    </header>
  );
}
