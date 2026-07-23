import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../../lib/auth';
import AppHeader, { headerPill } from '../../components/AppHeader';
import ScheduleOverview from '../../components/admin/ScheduleOverview';
import LiveBookingFeed from '../../components/admin/LiveBookingFeed';
import CouponTracker from '../../components/admin/CouponTracker';
import DriversPanel from '../../components/admin/DriversPanel';
import CustomersPanel from '../../components/admin/CustomersPanel';
import SettingsCard from '../../components/admin/SettingsCard';

const sections = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Settings' },
];

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
          <p className="mt-1.5 text-sm text-muted">
            Driver schedules, live bookings, coupons, and the driver &amp; customer rosters.
          </p>
        </div>

        <nav className="sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto border-b border-hairline bg-canvas/90 px-5 py-2 backdrop-blur">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={`${headerPill} text-xs! shrink-0 text-muted hover:text-ink`}>
              {s.label}
            </a>
          ))}
        </nav>

        <section id="schedule" className="scroll-mt-20">
          <ScheduleOverview />
        </section>

        <section id="bookings" className="grid scroll-mt-20 gap-6 lg:grid-cols-2">
          <LiveBookingFeed onComplete={() => setCouponRefresh((n) => n + 1)} />
          <CouponTracker refreshKey={couponRefresh} />
        </section>

        <section id="drivers" className="grid scroll-mt-20 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <DriversPanel />
          <SettingsCard />
        </section>

        <section id="customers" className="scroll-mt-20">
          <CustomersPanel />
        </section>
      </div>
    </main>
  );
}
