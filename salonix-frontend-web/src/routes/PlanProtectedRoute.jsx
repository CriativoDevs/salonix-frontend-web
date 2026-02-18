import { Navigate, useLocation } from 'react-router-dom';
import usePlanGate from '../hooks/usePlanGate';

export default function PlanProtectedRoute({
  children,
  featureKey,
  requiredTier,
}) {
  const location = useLocation();
  const { allowed, loading } = usePlanGate({ featureKey, requiredTier });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/plans" replace state={{ from: location }} />;
  }

  return children;
}
