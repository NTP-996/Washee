// Date helpers for the booking calendar. All ISO strings are local-calendar
// YYYY-MM-DD (never UTC-shifted), so "today" matches what the user sees on the
// clock. String comparison on this format is chronological, which the calendar
// relies on for the min-date guard.

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// A calendar month as rows of 7 cells, Monday-first. Cells outside the month
// are null so the caller can render blanks.
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // JS 0=Sun..6=Sat → 0=Mon..6=Sun
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(isoDate(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function locale(lang: string): string {
  return lang === 'vi' ? 'vi-VN' : 'en-US';
}

// "Fri · Jul 24" (localized) — the heading over the time-slot list.
export function formatLong(iso: string, lang: string): string {
  const parts = new Intl.DateTimeFormat(locale(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(parseISO(iso));
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const rest = parts
    .filter((p) => p.type !== 'weekday' && p.type !== 'literal')
    .map((p) => p.value);
  return `${weekday} · ${rest.join(' ')}`;
}

// "July 2026" (localized) — the calendar header.
export function formatMonth(year: number, month: number, lang: string): string {
  return new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
}

// Localized weekday abbreviations, Monday-first (2024-01-01 was a Monday).
export function weekdayLabels(lang: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale(lang), { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
}
