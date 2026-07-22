import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// Primary CTA — the one brand gradient, with dark on-accent text (never white).
export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`brand-gradient rounded-full px-6 py-3 font-semibold text-[color:var(--color-on-accent)] transition disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-ink outline-none transition focus:border-brand-to ${className}`}
      {...props}
    />
  );
}

// HUD corner brackets — the BMW-M "precision detailing" nod. Purely decorative;
// place inside a `relative` container so the arms pin to its corners.
export function CornerBrackets() {
  const arm = 'pointer-events-none absolute h-3 w-3 border-brand-to/40';
  return (
    <>
      <span className={`${arm} left-0 top-0 border-l border-t`} />
      <span className={`${arm} right-0 top-0 border-r border-t`} />
      <span className={`${arm} bottom-0 left-0 border-b border-l`} />
      <span className={`${arm} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
