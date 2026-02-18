import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useClientAuth';

function ClientPrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useClientAuth();

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
