import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export const useOpsUsers = () => {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (err) {
      console.error('Failed to list users', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createUser = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/users/', data);
      return response.data;
    } catch (err) {
      console.error('Failed to create user', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateUser = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/users/${id}/`, data);
      return response.data;
    } catch (err) {
      console.error(`Failed to update user ${id}`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const deleteUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/users/${id}/`);
      return true;
    } catch (err) {
      console.error(`Failed to delete user ${id}`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
  };
};
