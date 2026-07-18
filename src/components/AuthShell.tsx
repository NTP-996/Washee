import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

// Branded frame for the auth pages: logo, HUD card, tri-blue speed stripe.
export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <img src="/washee-mark.svg" alt="" width={34} height={34} />
        <span className="text-lg font-semibold lowercase tracking-tight">washee</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-panel p-6 sm:p-8">
        <div className="speed-stripe mb-5 h-1 w-12 rounded-full" />
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}
