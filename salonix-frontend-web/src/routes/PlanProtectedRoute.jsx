import { Navigate, useLocation } from 'react-router-dom';
import usePlanGate from '../hooks/usePlanGate';

export default function PlanProtectedRoute({ children, featureKey, requiredTier }) {
  const location = useLocation();
  const { allowed } = usePlanGate({ featureKey, requiredTier });

  if (!allowed) {
    return <Navigate to="/plans" replace state={{ from: location }} />;
  }

  return children;
}
