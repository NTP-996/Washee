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
      className={`w-full rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-ink transition focus:border-brand-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-to ${className}`}
      {...props}
    />
  );
}

// One star glyph. Filled stars take the brand-from tint; unfilled stars render
// as hollow text-muted outlines so the 5-star denominator stays legible on the
// dark panels (WCAG 1.4.11 — solid text-hairline fills were ~1.2:1, invisible).
function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? undefined : 'currentColor'}
      strokeWidth={filled ? undefined : 1.5}
      className={className}
    >
      <path d="M10 1.2l2.69 5.62 6.11.6-4.6 4.16 1.28 6.02L10 14.9l-5.48 3.2 1.28-6.02-4.6-4.16 6.11-.6z" />
    </svg>
  );
}

// A row of 5 stars. Pass onChange for an interactive picker; omit it for a
// read-only display of an existing rating (0 renders all stars hollow).
// `label` names the group (interactive) or the whole rating image (read-only) —
// pass a localized string on customer surfaces.
export function StarRating({
  value,
  onChange,
  size = 'md',
  label,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const dim = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  // Read-only: a single named image — the star glyphs are decoration; the
  // value lives in the accessible name so assistive tech can read the rating.
  if (!onChange) {
    return (
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={label ?? `${value} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            aria-hidden="true"
            className={n <= value ? 'text-brand-from' : 'text-muted'}
          >
            <StarIcon filled={n <= value} className={dim} />
          </span>
        ))}
      </div>
    );
  }

  // Interactive: five plain labeled buttons in a named group. Each glyph keeps
  // its size but sits centered in a 44px hit target (negative margins keep the
  // row visually compact).
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
          className={`-m-2 grid h-11 w-11 cursor-pointer place-items-center ${
            n <= value ? 'text-brand-from' : 'text-muted'
          }`}
        >
          <StarIcon filled={n <= value} className={dim} />
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
