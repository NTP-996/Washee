import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiRequestError } from '../lib/api';
import { formatVnd } from '../lib/format';
import type { Booking, CalendarSlot, CarLocation, Coupon, ReferralSummary } from '../types';
import SlotPicker from '../components/booking/SlotPicker';
import BookingHistory from '../components/booking/BookingHistory';
import { Button } from '../components/ui';

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const [date, setDate] = useState(tomorrow());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [locations, setLocations] = useState<CarLocation[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [locationId, setLocationId] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
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
    }
  }

  useEffect(() => {
    void loadSlots(date);
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
      await api('/api/bookings', {
        method: 'POST',
        body: {
          slotId: selectedSlot.id,
          carLocationId: locationId,
          couponId: applying ? coupon.id : undefined,
        },
      });
      setSuccess(`Booked ${selectedSlot.date} at ${selectedSlot.startTime}. See you there!`);
      setSelectedSlot(null);
      await Promise.all([loadSlots(date), loadBookings(), loadCoupons()]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not book that slot');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string): Promise<void> {
    await api(`/api/bookings/${id}/cancel`, { method: 'PATCH' }).catch(() => undefined);
    await Promise.all([loadBookings(), loadSlots(date), loadCoupons()]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-5 py-10 text-ink">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Book a wash</h1>
        <Link to="/profile" className="rounded-full border border-hairline px-4 py-2 text-sm">
          Profile
        </Link>
      </div>

      {locations.length === 0 && (
        <p className="mb-6 rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-sm text-muted">
          Add a car location in your{' '}
          <Link to="/profile" className="text-brand-from">
            profile
          </Link>{' '}
          first.
        </p>
      )}

      <section className="rounded-2xl border border-hairline bg-panel p-6">
        <div className="speed-stripe mb-5 h-1 w-12 rounded-full" />
        <SlotPicker
          date={date}
          slots={slots}
          selectedId={selectedSlot?.id ?? null}
          onDateChange={setDate}
          onPick={setSelectedSlot}
        />

        {selectedSlot && (
          <div className="mt-6 border-t border-hairline pt-5">
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm text-muted">Car location</span>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-panel-2 px-4 py-3 text-ink outline-none focus:border-brand-to"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} — {l.address}
                  </option>
                ))}
              </select>
            </label>

            {coupon && (
              <label className="mb-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useCoupon} onChange={(e) => setUseCoupon(e.target.checked)} />
                Apply my {coupon.discountPercent}% off coupon
              </label>
            )}

            <Button onClick={confirm} disabled={busy || !locationId} className="w-full">
              {busy ? '…' : `Confirm ${selectedSlot.startTime} · ${formatVnd(effectivePrice)}`}
            </Button>
            {applying && (
              <p className="mt-2 text-center text-xs text-brand-from">
                {coupon.discountPercent}% off applied — was {formatVnd(selectedSlot.price)}
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mt-4 text-sm text-brand-from">{success}</p>}
      </section>

      <h2 className="mb-3 mt-8 text-sm uppercase tracking-widest text-muted">Your bookings</h2>
      <BookingHistory bookings={bookings} onCancel={cancel} />
    </main>
  );
}
