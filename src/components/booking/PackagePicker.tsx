import { useI18n } from '../../lib/i18n';
import { formatVnd } from '../../lib/format';
import type { WashPackage } from '../../types';

// Card list of active packages, each priced for the currently-selected car
// type. Package eligibility for slots is resolved server-side once a package
// is picked, not filtered here.
export default function PackagePicker({
  packages,
  carTypeId,
  value,
  onChange,
}: {
  packages: WashPackage[];
  carTypeId: string;
  value: string;
  onChange: (packageId: string) => void;
}) {
  const { t } = useI18n();

  if (packages.length === 0) {
    return <p className="text-sm text-muted">{t('booking.noPackages')}</p>;
  }

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-widest text-muted">
        {t('booking.choosePackage')}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {packages.map((pkg) => {
          const price = pkg.prices.find((p) => p.carTypeId === carTypeId);
          const active = pkg.id === value;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange(pkg.id)}
              disabled={!price}
              className={`relative rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'border-brand-to bg-panel-2' : 'border-hairline hover:border-brand-to'
              }`}
            >
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 w-1 ${active ? 'speed-stripe' : ''}`}
              />
              <div className="pl-1">
                <div className="font-semibold">{pkg.title}</div>
                {pkg.description && <p className="mt-1 text-xs text-muted">{pkg.description}</p>}
                <div className="mt-2 tabular-nums">
                  {price ? (
                    <span className="text-lg font-bold">{formatVnd(price.priceVnd)}</span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
