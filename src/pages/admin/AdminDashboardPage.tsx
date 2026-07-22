import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../../lib/auth';
import AppHeader, { headerPill } from '../../components/AppHeader';
import CalendarEditor from '../../components/admin/CalendarEditor';
import LiveBookingFeed from '../../components/admin/LiveBookingFeed';
import CouponTracker from '../../components/admin/CouponTracker';

export default function AdminDashboardPage() {
  const nav = useNavigate();
  const [couponRefresh, setCouponRefresh] = useState(0);

  useEffect(() => {
    document.title = 'washee · admin';
  }, []);

  function logout(): void {
    tokenStore.clearAdmin();
    nav('/admin/login', { replace: true });
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <AppHeader sub="admin">
        <span className="hidden px-2 text-sm text-muted sm:block">{tokenStore.adminUsername}</span>
        <button onClick={logout} className={`${headerPill} text-muted hover:text-ink`}>
          Log out
        </button>
      </AppHeader>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:py-10">
        <div>
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Dashboard</h1>
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
