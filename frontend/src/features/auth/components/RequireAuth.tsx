import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Shows protected routes only when the cookie session is authenticated.
 * Otherwise redirects to login and preserves the requested location.
 * 
 * @returns The protected route or a login redirect. 
 */
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
