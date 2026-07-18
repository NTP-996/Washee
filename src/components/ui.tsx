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
