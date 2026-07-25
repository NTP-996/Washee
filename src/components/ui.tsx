import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// Primary CTA — the one brand gradient, with dark on-accent text (never white).
export function Button({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`brand-gradient rounded-full px-6 py-3 font-semibold text-[color:var(--color-on-accent)] transition hover:brightness-110 active:brightness-95 disabled:opacity-60 ${className}`}
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

// A row of 5 stars. Pass onChange for an interactive picker; omit it for a
// read-only display of an existing rating (0 renders all stars hollow).
export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: 'sm' | 'md';
}) {
  const interactive = !!onChange;
  const dim = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          tabIndex={interactive ? 0 : -1}
          aria-hidden={!interactive}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={interactive ? n <= value : undefined}
          onClick={interactive ? () => onChange(n) : undefined}
          className={`${dim} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${
            n <= value ? 'text-brand-from' : 'text-hairline'
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full">
            <path d="M10 1.2l2.69 5.62 6.11.6-4.6 4.16 1.28 6.02L10 14.9l-5.48 3.2 1.28-6.02-4.6-4.16 6.11-.6z" />
          </svg>
        </button>
      ))}
    </div>
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
