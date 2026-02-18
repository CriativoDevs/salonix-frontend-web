import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useClientAuth } from '../hooks/useClientAuth';
import { consumePostAuthRedirect } from '../utils/navigation';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAuthenticated: isClientAuthenticated, isLoading: isClientLoading } =
    useClientAuth();

  if (isLoading || isClientLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  // Se cliente autenticado, redirecionar para área do cliente
  if (isClientAuthenticated) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Se owner/staff/manager autenticado, redirecionar para dashboard
  if (isAuthenticated) {
    const scheduled = consumePostAuthRedirect();
    const target = scheduled || '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
}

export default PublicRoute;
