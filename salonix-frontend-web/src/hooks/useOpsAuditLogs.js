import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export const useOpsAuditLogs = () => {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listAuditLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/audit-logs/', { params: filters });
      return response.data;
    } catch (err) {
      console.error('Failed to list audit logs', err);
      const customError = {
        message:
          err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          err.message ||
          'Erro desconhecido',
        code: err.response?.data?.error?.code,
        original: err,
      };
      setError(customError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    listAuditLogs,
    loading,
    error,
  };
};
