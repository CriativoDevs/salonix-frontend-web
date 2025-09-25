import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { consumePostAuthRedirect } from '../utils/navigation';
import { getEnvFlag } from '../utils/env';

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const enablePlans = getEnvFlag('VITE_PLAN_WIZARD_AFTER_LOGIN');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('[PrivateRoute] Authenticated navigation to', location.pathname);
    }
  }, [isLoading, isAuthenticated, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se o wizard de planos está ativo, preferir levar o utilizador para /plans
  // quando a rota atual for o dashboard inicial.
  const scheduled = consumePostAuthRedirect();
  if (scheduled) {
    return <Navigate to={scheduled} replace state={{ from: location }} />;
  }

  if (enablePlans && location.pathname === '/dashboard') {
    return <Navigate to="/plans" replace state={{ from: location }} />;
  }

  return children;
}

export default PrivateRoute;
