import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { refreshClientSession } from '../api/clientAccess';

function ClientPrivateRoute({ children }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const present = localStorage.getItem('client_session_present') === '1';
        if (!present) {
          setIsAuthenticated(false);
          return;
        }
        await refreshClientSession();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/client/enter" replace />;
  }

  return children;
}

export default ClientPrivateRoute;

