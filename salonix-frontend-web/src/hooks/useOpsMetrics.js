import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export function useOpsMetrics() {
  const { api } = useOpsAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/metrics/overview/');
      setMetrics(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.data?.code === 'E001') {
        // Auth error, context will handle redirect
        return;
      }
      console.error('Error loading ops metrics:', err);
      setError(err.response?.data?.detail || 'Falha ao carregar métricas.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    metrics,
    loading,
    error,
    loadMetrics,
  };
}
