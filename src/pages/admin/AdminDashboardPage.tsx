import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../../lib/auth';
import CalendarEditor from '../../components/admin/CalendarEditor';
import LiveBookingFeed from '../../components/admin/LiveBookingFeed';
import CouponTracker from '../../components/admin/CouponTracker';

export default function AdminDashboardPage() {
  const nav = useNavigate();
  const [couponRefresh, setCouponRefresh] = useState(0);

  function logout(): void {
    tokenStore.clearAdmin();
    nav('/admin/login', { replace: true });
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/washee-mark.svg" alt="" className="h-7 w-7" />
            <div>
              <div className="text-sm font-semibold tracking-tight">washee · admin</div>
              <div className="text-xs text-muted">{tokenStore.adminUsername}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-hairline px-4 py-2 text-sm transition hover:border-brand-to"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:py-10">
        <div>
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-sm text-muted">Manage availability, live bookings, and referral coupons.</p>
        </div>

        <CalendarEditor />

        <div className="grid gap-6 lg:grid-cols-2">
          <LiveBookingFeed onComplete={() => setCouponRefresh((n) => n + 1)} />
          <CouponTracker refreshKey={couponRefresh} />
        </div>
      </div>
    </main>
  );
}
