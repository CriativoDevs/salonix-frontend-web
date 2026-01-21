import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { consumePostAuthRedirect } from '../utils/navigation';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (isAuthenticated) {
    const scheduled = consumePostAuthRedirect();
    const target = scheduled || '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
}

export default PublicRoute;
