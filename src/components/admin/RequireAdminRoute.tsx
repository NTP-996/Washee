import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { tokenStore } from '../../lib/auth';

// Gates the admin dashboard behind a stored admin token.
export default function RequireAdminRoute({ children }: { children: ReactNode }) {
  if (!tokenStore.adminAccess) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
