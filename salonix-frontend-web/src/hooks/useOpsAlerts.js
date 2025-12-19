import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export function useOpsAlerts() {
  const { api } = useOpsAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listAlerts = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.resolved !== undefined) {
          params.append('resolved', filters.resolved);
        }
        if (filters.category) {
          params.append('category', filters.category);
        }
        if (filters.severity) {
          params.append('severity', filters.severity);
        }

        const response = await api.get(`/alerts/?${params.toString()}`);
        setAlerts(response.data);
        return response.data;
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.data?.code === 'E001'
        ) {
          // Auth error, context will handle redirect
          return [];
        }
        console.error('Error loading ops alerts:', err);
        setError(err.response?.data?.detail || 'Falha ao carregar alertas.');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const resolveAlert = useCallback(
    async (alertId) => {
      try {
        const response = await api.post(`/alerts/${alertId}/resolve/`);
        // Atualiza a lista localmente
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? response.data.alert : alert
          )
        );
        return response.data;
      } catch (err) {
        console.error('Error resolving alert:', err);
        throw err;
      }
    },
    [api]
  );

  return {
    alerts,
    loading,
    error,
    listAlerts,
    resolveAlert,
  };
}
