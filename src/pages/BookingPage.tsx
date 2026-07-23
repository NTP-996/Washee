import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiRequestError } from '../lib/api';
import { formatVnd } from '../lib/format';
import { formatLong, todayISO } from '../lib/date';
import { useI18n } from '../lib/i18n';
import type { Booking, CalendarSlot, CarLocation, Coupon, ReferralSummary } from '../types';
import SlotPicker from '../components/booking/SlotPicker';
import BookingHistory from '../components/booking/BookingHistory';
import AppHeader, { headerPill } from '../components/AppHeader';
import { Button, CornerBrackets, Field } from '../components/ui';

export default function BookingPage() {
  const { lang, t, tf } = useI18n();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [locations, setLocations] = useState<CarLocation[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [locationId, setLocationId] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [useCoupon, setUseCoupon] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadSlots(d: string): Promise<void> {
    try {
      setSlots(await api<CalendarSlot[]>(`/api/bookings/slots?date=${d}`));
    } catch {
      setSlots([]);
    }
  }
  async function loadBookings(): Promise<void> {
    try {
      setBookings(await api<Booking[]>('/api/bookings/me'));
    } catch {
      /* ignore */
    }
  }
  async function loadCoupons(): Promise<void> {
    try {
      const ref = await api<ReferralSummary>('/api/users/me/referral');
      setCoupons(ref.coupons.filter((c) => c.status === 'available'));
    } catch {
      /* ignore */
    } finally {
      setCouponsLoaded(true);
    }
  }

  useEffect(() => {
    document.title = `washee — ${t('booking.title')}`;
  }, [t]);

  useEffect(() => {
    void loadSlots(date);
    setSelectedSlot(null); // a new day invalidates the previously picked time
  }, [date]);

  useEffect(() => {
    api<CarLocation[]>('/api/users/me/locations')
      .then((ls) => {
        setLocations(ls);
        const def = ls.find((l) => l.isDefault) ?? ls[0];
        if (def) setLocationId(def.id);
      })
      .catch(() => undefined);
    void loadBookings();
    void loadCoupons();
  }, []);

  const coupon = coupons[0] ?? null;
  const applying = !!coupon && useCoupon;
  const effectivePrice =
    selectedSlot && applying
      ? Math.round(selectedSlot.price * (1 - coupon.discountPercent / 100))
      : (selectedSlot?.price ?? 0);

  async function confirm(): Promise<void> {
    if (!selectedSlot || !locationId) return;
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const booked = await api<Booking>('/api/bookings', {
        method: 'POST',
        body: {
          slotId: selectedSlot.id,
          carLocationId: locationId,
          couponId: applying ? coupon.id : undefined,
        },
      });
      setSuccess(
        tf('bookingSuccess', {
          date: formatLong(selectedSlot.date, lang),
          time: selectedSlot.startTime,
          driver: booked.driverName,
        }),
      );
      setSelectedSlot(null);
      await Promise.all([loadSlots(date), loadBookings(), loadCoupons()]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('booking.errBook'));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string): Promise<void> {
    setError('');
    try {
      await api(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('booking.errCancel'));
    }
    await Promise.all([loadBookings(), loadSlots(date), loadCoupons()]);
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <AppHeader>
        <Link to="/profile" className={headerPill}>
          {t('nav.profile')}
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
        <div className="mb-6">
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            {t('booking.title')}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{t('booking.subtitle')}</p>
        </div>

        {locations.length === 0 && (
          <p className="mb-5 rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm text-muted">
            {t('booking.noLocation.pre')}{' '}
            <Link to="/profile" className="text-brand-from underline-offset-2 hover:underline">
              {t('booking.noLocation.link')}
            </Link>{' '}
            {t('booking.noLocation.post')}
          </p>
        )}

        {coupon && (
          <p className="mb-5 flex items-center gap-2.5 rounded-xl border border-brand-to/40 bg-panel-2 px-4 py-3 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-to" aria-hidden />
            <span>
              <span className="font-semibold text-brand-from">
                {tf('percentOff', { percent: coupon.discountPercent })}
              </span>{' '}
              {t('booking.couponReady')}
            </span>
          </p>
        )}
        {couponsLoaded && !coupon && (
          <p className="mb-5 text-sm text-muted">
            {t('booking.earn.pre')}{' '}
            <Link to="/profile" className="text-brand-from underline-offset-2 hover:underline">
              {t('booking.earn.link')}
            </Link>{' '}
            {t('booking.earn.post')}
          </p>
        )}

        <section className="relative rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
          <CornerBrackets />
          <SlotPicker
            date={date}
            slots={slots}
            selectedId={selectedSlot?.id ?? null}
            onDateChange={setDate}
            onPick={setSelectedSlot}
          />
        </section>

        {selectedSlot && (
          <section className="mt-4 rounded-2xl border border-hairline bg-panel-2 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted">
                  {t('booking.selected')}
                </div>
                <div className="font-semibold tabular-nums">
                  {formatLong(selectedSlot.date, lang)} · {selectedSlot.startTime}
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="shrink-0 text-sm text-muted transition hover:text-ink"
              >
                {t('booking.change')}
              </button>
            </div>

            <Field label={t('booking.carLocation')}>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-panel px-4 py-3 text-ink outline-none transition focus:border-brand-to"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} — {l.address}
                  </option>
                ))}
              </select>
            </Field>

            {coupon && (
              <label className="mt-4 flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={useCoupon}
                  onChange={(e) => setUseCoupon(e.target.checked)}
                  className="h-4 w-4 accent-brand-to"
                />
                {tf('applyCoupon', { percent: coupon.discountPercent })}
              </label>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-hairline pt-4">
              <span className="text-sm text-muted">{t('booking.total')}</span>
              <span className="tabular-nums">
                {applying && (
                  <s className="mr-2 text-sm text-muted">{formatVnd(selectedSlot.price)}</s>
                )}
                <span className="text-lg font-bold">{formatVnd(effectivePrice)}</span>
              </span>
            </div>
            {applying && (
              <p className="mt-1 text-right text-xs text-brand-from">
                {tf('couponApplied', { percent: coupon.discountPercent })}
              </p>
            )}
            <Button onClick={confirm} disabled={busy || !locationId} className="mt-4 w-full">
              {busy ? '…' : t('booking.confirm')}
            </Button>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mt-4 text-sm text-brand-from">{success}</p>}

        <h2 className="mb-3 mt-10 text-xs uppercase tracking-widest text-muted">
          {t('booking.yourBookings')}
        </h2>
        <BookingHistory bookings={bookings} onCancel={cancel} />
      </div>
    </main>
  );
}
