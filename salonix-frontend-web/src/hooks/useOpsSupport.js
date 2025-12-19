import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export function useOpsSupport() {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resendNotification = useCallback(
    async (notificationId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/support/resend-notification/', {
          notification_id: notificationId,
        });
        return response.data;
      } catch (err) {
        console.error('Error resending notification:', err);
        const msg =
          err.response?.data?.detail || 'Falha ao reenviar notificação.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const clearLockout = useCallback(
    async (lockoutId, note = '') => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/ops/support/clear-lockout/', {
          lockout_id: lockoutId,
          note,
        });
        return response.data;
      } catch (err) {
        console.error('Error clearing lockout:', err);
        const msg = err.response?.data?.detail || 'Falha ao desbloquear conta.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    loading,
    error,
    resendNotification,
    clearLockout,
  };
}
