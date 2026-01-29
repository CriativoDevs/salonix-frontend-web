import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ClientPrivateRoute({ children }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = localStorage.getItem('client_access_token');
        if (!token) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }
        // Token exists - consider authenticated
        // Note: Token validation happens on API calls
        if (!cancelled) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
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
