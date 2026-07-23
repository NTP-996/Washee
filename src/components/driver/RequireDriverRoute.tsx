import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { tokenStore } from '../../lib/auth';

// Gates the driver portal behind a stored driver token.
export default function RequireDriverRoute({ children }: { children: ReactNode }) {
  if (!tokenStore.driverAccess) return <Navigate to="/driver/login" replace />;
  return <>{children}</>;
}
