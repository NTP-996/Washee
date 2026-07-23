import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../../lib/auth';
import AppHeader, { headerPill } from '../../components/AppHeader';
import AvailabilityEditor from '../../components/driver/AvailabilityEditor';
import MyJobs from '../../components/driver/MyJobs';

export default function DriverDashboardPage() {
  const nav = useNavigate();

  useEffect(() => {
    document.title = 'washee · driver';
  }, []);

  function logout(): void {
    tokenStore.clearDriver();
    nav('/driver/login', { replace: true });
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <AppHeader sub="driver">
        <span className="hidden px-2 text-sm text-muted sm:block">{tokenStore.driverName}</span>
        <button onClick={logout} className={`${headerPill} text-muted hover:text-ink`}>
          Log out
        </button>
      </AppHeader>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <div>
          <div className="speed-stripe mb-3 h-1 w-12 rounded-full" />
          <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            My schedule
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Publish the hours you can work — bookings land in your job sheet.
          </p>
        </div>

        <AvailabilityEditor />
        <MyJobs />
      </div>
    </main>
  );
}
