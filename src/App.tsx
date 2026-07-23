import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import DriverLoginPage from './pages/driver/DriverLoginPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import RequireAuth from './components/RequireAuth';
import RequireAdminRoute from './components/admin/RequireAdminRoute';
import RequireDriverRoute from './components/driver/RequireDriverRoute';

export default function App() {
  return (
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
  );
}
