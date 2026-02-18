import { useState, useCallback } from 'react';
import { useOpsAuth } from './useOpsAuth';

export const useOpsTenants = () => {
  const { api } = useOpsAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listTenants = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/tenants/', { params });
        return response.data;
      } catch (err) {
        console.error('Failed to list tenants', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const getTenant = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/tenants/${id}/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to get tenant ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const resetOwnerPassword = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/tenants/${id}/reset_owner/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to reset owner password for tenant ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updatePlan = useCallback(
    async (id, plan_tier) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/tenants/${id}/update_plan/`, {
          plan_tier,
        });
        return response.data;
      } catch (err) {
        console.error(`Failed to update plan for tenant ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const blockTenant = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/tenants/${id}/block/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to block tenant ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const unblockTenant = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/tenants/${id}/unblock/`);
        return response.data;
      } catch (err) {
        console.error(`Failed to unblock tenant ${id}`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    listTenants,
    getTenant,
    resetOwnerPassword,
    updatePlan,
    blockTenant,
    unblockTenant,
    loading,
    error,
  };
};
