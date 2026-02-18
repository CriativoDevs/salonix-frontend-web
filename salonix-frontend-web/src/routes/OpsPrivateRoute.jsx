import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOpsAuth } from '../hooks/useOpsAuth';
import { Loader2 } from 'lucide-react';

function OpsPrivateRoute({ children }) {
  const { user, loading } = useOpsAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-gray-400">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        Carregando Ops...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/ops/login" state={{ from: location }} replace />;
  }

  return children;
}

export default OpsPrivateRoute;
