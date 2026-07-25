import { useI18n } from '../../lib/i18n';
import type { CarType } from '../../types';

// A pill row of the admin-managed car types — never hardcode labels, since
// admins can rename/reorder them.
export default function CarTypeSelect({
  carTypes,
  value,
  onChange,
}: {
  carTypes: CarType[];
  value: string;
  onChange: (carTypeId: string) => void;
}) {
  const { t } = useI18n();
  if (carTypes.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-widest text-muted">
        {t('booking.chooseCarType')}
      </div>
      <div className="flex flex-wrap gap-2">
        {carTypes.map((ct) => {
          const active = ct.id === value;
          return (
            <button
              key={ct.id}
              type="button"
              onClick={() => onChange(ct.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-transparent brand-gradient text-[color:var(--color-on-accent)]'
                  : 'border-hairline text-muted hover:border-brand-to hover:text-ink'
              }`}
            >
              {ct.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
