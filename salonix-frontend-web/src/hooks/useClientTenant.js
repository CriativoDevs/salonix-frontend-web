import { useState, useEffect, useCallback } from 'react';
import { fetchPublicTenant } from '../api/tenant';
import { getStoredTenantSlug } from '../utils/tenantStorage';

/**
 * Hook para carregar dados públicos do tenant para clientes.
 * NÃO requer autenticação.
 *
 * Diferente de useTenant() que é para owners/managers e requer auth.
 */
export function useClientTenant() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTenant = useCallback(async () => {
    const slug = getStoredTenantSlug();

    if (!slug) {
      setError({ message: 'Tenant slug não encontrado' });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPublicTenant(slug);
      setTenant(data);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Erro ao carregar dados do estabelecimento';
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  return {
    tenant,
    loading,
    error,
    refetch: loadTenant,
  };
}

export default useClientTenant;
