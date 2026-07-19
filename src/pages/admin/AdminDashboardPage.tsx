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
    <main className="mx-auto min-h-screen max-w-5xl bg-canvas px-5 py-10 text-ink">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-muted">{tokenStore.adminUsername}</p>
        </div>
        <button onClick={logout} className="rounded-full border border-hairline px-4 py-2 text-sm">
          Log out
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CalendarEditor />
        <LiveBookingFeed onComplete={() => setCouponRefresh((n) => n + 1)} />
      </div>
      <div className="mt-6">
        <CouponTracker refreshKey={couponRefresh} />
      </div>
    </main>
  );
}
