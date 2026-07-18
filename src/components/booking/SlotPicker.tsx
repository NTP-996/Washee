import type { CalendarSlot } from '../../types';
import { formatVnd } from '../../lib/format';

export default function SlotPicker({
  date,
  slots,
  selectedId,
  onDateChange,
  onPick,
}: {
  date: string;
  slots: CalendarSlot[];
  selectedId: string | null;
  onDateChange: (d: string) => void;
  onPick: (s: CalendarSlot) => void;
}) {
  return (
    <div>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm text-muted">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-ink outline-none focus:border-brand-to"
        />
      </label>
      {slots.length === 0 ? (
        <p className="text-sm text-muted">No open slots for this date.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selectedId === s.id ? 'border-brand-to bg-panel-2' : 'border-hairline hover:border-brand-to'
              }`}
            >
              <div className="font-semibold">{s.startTime}</div>
              <div className="text-xs text-muted">
                {formatVnd(s.price)} · {s.durationMinutes}m
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
