import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export const useOpsNotificationTemplates = () => {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listTemplates = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/notification-templates/', { params });
        return response.data;
      } catch (err) {
        console.error('Failed to list notification templates', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const getTemplate = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/notification-templates/${id}/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to get notification template ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const createTemplate = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/notification-templates/', data);
        return response.data;
      } catch (err) {
        console.error('Failed to create notification template', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateTemplate = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.patch(`/notification-templates/${id}/`, data);
        return response.data;
      } catch (err) {
        console.error(`Failed to update notification template ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const deleteTemplate = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/notification-templates/${id}/`);
      } catch (err) {
        console.error(`Failed to delete notification template ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    loading,
    error,
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
