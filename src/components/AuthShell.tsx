import { useEffect } from 'react';
import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import { CornerBrackets } from './ui';

// Branded frame for the auth pages: the shared app bar, then a HUD card with
// the tri-blue speed stripe.
export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `washee — ${title}`;
  }, [title]);

  return (
    <main className="flex min-h-screen flex-col bg-canvas">
      <AppHeader />
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="relative w-full max-w-sm rounded-2xl border border-hairline bg-panel p-6 sm:p-8">
          <CornerBrackets />
          <div className="speed-stripe mb-5 h-1 w-12 rounded-full" />
          <h1 className="mb-6 text-2xl font-extrabold uppercase leading-tight tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
