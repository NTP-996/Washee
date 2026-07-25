import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiRequestError } from '../lib/api';
import { formatVnd } from '../lib/format';
import { formatLong, todayISO } from '../lib/date';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';
import type {
  Booking,
  CalendarSlot,
  CarLocation,
  CarType,
  Coupon,
  ReferralSummary,
  ReviewSummary,
  WashPackage,
} from '../types';
import CarTypeSelect from '../components/booking/CarTypeSelect';
import PackagePicker from '../components/booking/PackagePicker';
import SlotPicker from '../components/booking/SlotPicker';
import BookingHistory from '../components/booking/BookingHistory';
import ChatPanel from '../components/booking/ChatPanel';
import AppHeader, { headerPill } from '../components/AppHeader';
import { Button, CornerBrackets, Field, TextInput } from '../components/ui';
import { useBookingLive } from '../lib/useBookingLive';
import { useElapsed } from '../lib/useElapsed';

// A booking still somewhere in its active lifecycle (from request through to
// payment) gets the live top panel — mirrors the backend's chat.Service
// `active()` guard exactly.
const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

export default function BookingPage() {
  const { lang, t, tf } = useI18n();
  const { user } = useAuth();
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [packages, setPackages] = useState<WashPackage[]>([]);
  const [carTypeId, setCarTypeId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [locations, setLocations] = useState<CarLocation[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [locationId, setLocationId] = useState('');
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [useCoupon, setUseCoupon] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadSlots(d: string, pkgId: string): Promise<void> {
    if (!pkgId) {
      setSlots([]);
      return;
    }
    try {
      setSlots(await api<CalendarSlot[]>(`/api/bookings/slots?date=${d}&packageId=${pkgId}`));
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
    api<CarType[]>('/api/car-types')
      .then((types) => {
        setCarTypes(types);
        if (types.length > 0) setCarTypeId((id) => id || types[0].id);
      })
      .catch(() => setError(t('error.generic')));
    api<WashPackage[]>('/api/packages')
      .then((pkgs) => {
        setPackages(pkgs);
        if (pkgs.length > 0) setPackageId((id) => id || pkgs[0].id);
      })
      .catch(() => setError(t('error.generic')));
  }, [t]);

  // Package determines which drivers'/slots' availability even shows, so the
  // slot list reloads when it changes; car type only ever affects price, not
  // which slots are visible, so it doesn't need to trigger a reload.
  useEffect(() => {
    void loadSlots(date, packageId);
    setSelectedSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, packageId]);

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

  // Pre-fill the contact phone from the account, but only once — later edits
  // (e.g. booking for someone else's car) shouldn't get clobbered on rerender.
  useEffect(() => {
    if (user?.phone) setPhone((p) => p || user.phone);
  }, [user]);

  const selectedPackage = packages.find((p) => p.id === packageId) ?? null;
  const packagePrice = selectedPackage?.prices.find((p) => p.carTypeId === carTypeId) ?? null;
  const coupon = coupons[0] ?? null;
  const applying = !!coupon && useCoupon;
  const basePrice = packagePrice?.priceVnd ?? 0;
  const effectivePrice = applying
    ? Math.round(basePrice * (1 - coupon.discountPercent / 100))
    : basePrice;

  async function confirm(): Promise<void> {
    if (!selectedSlot || !locationId || !phone.trim() || !packageId || !carTypeId) return;
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const booked = await api<Booking>('/api/bookings', {
        method: 'POST',
        body: {
          slotId: selectedSlot.id,
          carLocationId: locationId,
          phone: phone.trim(),
          packageId,
          carTypeId,
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
      await Promise.all([loadSlots(date, packageId), loadBookings(), loadCoupons()]);
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
    await Promise.all([loadBookings(), loadSlots(date, packageId), loadCoupons()]);
  }

  function markReviewed(bookingId: string, review: ReviewSummary): void {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, review } : b)));
  }

  // The most recent booking still somewhere in its active lifecycle, if any —
  // gets its own live top panel that adapts its content to the current
  // status (waiting / confirmed / in-progress with a timer / awaiting
  // payment). Once the booking reaches a terminal status (via the live event
  // below), it drops out of this filter on its own and the history row
  // underneath already shows the resolved state. Same single-most-recent
  // scope as before — not multi-booking live tracking.
  const activeBooking = bookings.find((b) => ACTIVE_STATUSES.has(b.status)) ?? null;
  const elapsed = useElapsed(
    activeBooking?.status === 'in_progress' ? activeBooking.startedAt : null,
  );

  useBookingLive(
    activeBooking?.id ?? null,
    'customer',
    (ev) => {
      if (ev.type !== 'status' || !ev.status || !activeBooking) return;
      const status = ev.status;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === activeBooking.id
            ? {
                ...b,
                status: status as Booking['status'],
                declineReason: ev.declineReason ?? b.declineReason,
                startedAt: ev.startedAt ?? b.startedAt,
                finishedAt: ev.finishedAt ?? b.finishedAt,
              }
            : b,
        ),
      );
    },
    () => void loadBookings(),
  );

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

        {activeBooking && (
          <section className="relative mb-6 rounded-2xl border border-brand-to/40 bg-panel-2 p-5 sm:p-6">
            <CornerBrackets />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-to opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-to" />
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-widest">
                {activeBooking.status === 'pending' && t('booking.waitingTitle')}
                {activeBooking.status === 'confirmed' && t('booking.confirmedTitle')}
                {activeBooking.status === 'in_progress' && t('booking.inProgressTitle')}
                {activeBooking.status === 'awaiting_payment' && t('booking.awaitingPaymentTitle')}
              </h2>
            </div>
            {activeBooking.status === 'pending' && (
              <p className="mt-1.5 text-sm text-muted">{t('booking.waitingHint')}</p>
            )}
            {activeBooking.status === 'confirmed' && (
              <p className="mt-1.5 text-sm text-muted">{t('booking.confirmedHint')}</p>
            )}
            {activeBooking.status === 'in_progress' && elapsed && (
              <p className="mt-1.5 font-semibold tabular-nums text-brand-from">{elapsed}</p>
            )}
            {activeBooking.status === 'awaiting_payment' && (
              <p className="mt-1.5 text-sm text-muted">
                {t('booking.awaitingPaymentHint')} {formatVnd(activeBooking.price)}
              </p>
            )}
            <div className="mt-3 font-semibold tabular-nums">
              {formatLong(activeBooking.date, lang)} · {activeBooking.startTime}
            </div>
            <div className="text-sm text-muted">
              {t('history.washer')}: {activeBooking.driverName}
            </div>
            <ChatPanel bookingId={activeBooking.id} role="customer" active />
            {(activeBooking.status === 'pending' || activeBooking.status === 'confirmed') && (
              <button
                onClick={() => void cancel(activeBooking.id)}
                className="mt-3 text-sm text-muted hover:text-red-400"
              >
                {t('history.cancel')}
              </button>
            )}
          </section>
        )}

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

        <section className="relative space-y-5 rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
          <CornerBrackets />
          <CarTypeSelect carTypes={carTypes} value={carTypeId} onChange={setCarTypeId} />
          <PackagePicker
            packages={packages}
            carTypeId={carTypeId}
            value={packageId}
            onChange={setPackageId}
          />
        </section>

        {packageId && (
          <section className="relative mt-4 rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
            <CornerBrackets />
            <SlotPicker
              date={date}
              slots={slots}
              selectedId={selectedSlot?.id ?? null}
              onDateChange={setDate}
              onPick={setSelectedSlot}
            />
          </section>
        )}

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

            <Field label={t('booking.phone')}>
              <TextInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <span className="mt-1 block text-xs text-muted">{t('booking.phone.hint')}</span>
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
                {applying && <s className="mr-2 text-sm text-muted">{formatVnd(basePrice)}</s>}
                <span className="text-lg font-bold">{formatVnd(effectivePrice)}</span>
              </span>
            </div>
            {applying && (
              <p className="mt-1 text-right text-xs text-brand-from">
                {tf('couponApplied', { percent: coupon.discountPercent })}
              </p>
            )}
            <Button
              onClick={confirm}
              disabled={busy || !locationId || !phone.trim()}
              className="mt-4 w-full"
            >
              {busy ? '…' : t('booking.confirm')}
            </Button>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mt-4 text-sm text-brand-from">{success}</p>}

        <h2 className="mb-3 mt-10 text-xs uppercase tracking-widest text-muted">
          {t('booking.yourBookings')}
        </h2>
        <BookingHistory bookings={bookings} onCancel={cancel} onReviewed={markReviewed} />
      </div>
    </main>
  );
}
