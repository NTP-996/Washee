import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import RequireAuth from './components/RequireAuth';
import RequireAdminRoute from './components/admin/RequireAdminRoute';
import RequireDriverRoute from './components/driver/RequireDriverRoute';

// The admin and driver dashboards (and their panel-heavy dependencies) are
// only ever needed by operators, not customers — code-split them out of the
// customer-facing bundle instead of shipping every panel to every visitor.
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const DriverLoginPage = lazy(() => import('./pages/driver/DriverLoginPage'));
const DriverDashboardPage = lazy(() => import('./pages/driver/DriverDashboardPage'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/booking"
          element={
            <RequireAuth>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdminRoute>
              <AdminDashboardPage />
            </RequireAdminRoute>
          }
        />
        <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/driver/login" element={<DriverLoginPage />} />
        <Route
          path="/driver/dashboard"
          element={
            <RequireDriverRoute>
              <DriverDashboardPage />
            </RequireDriverRoute>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  );
}
