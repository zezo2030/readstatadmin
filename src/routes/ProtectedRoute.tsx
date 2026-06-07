import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/authStore';

export function ProtectedRoute() {
  const status = useAuth((s) => s.status);
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        …
      </div>
    );
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
