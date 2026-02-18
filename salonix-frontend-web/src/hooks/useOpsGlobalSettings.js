import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export const useOpsGlobalSettings = () => {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listSettings = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/global-settings/', { params });
        return response.data;
      } catch (err) {
        console.error('Failed to list global settings', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const getSetting = useCallback(
    async (key) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/global-settings/${key}/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to get global setting ${key}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const createSetting = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/global-settings/', data);
        return response.data;
      } catch (err) {
        console.error('Failed to create global setting', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateSetting = useCallback(
    async (key, data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.patch(`/global-settings/${key}/`, data);
        return response.data;
      } catch (err) {
        console.error(`Failed to update global setting ${key}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const deleteSetting = useCallback(
    async (key) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/global-settings/${key}/`);
      } catch (err) {
        console.error(`Failed to delete global setting ${key}`, err);
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
    listSettings,
    getSetting,
    createSetting,
    updateSetting,
    deleteSetting,
  };
};
