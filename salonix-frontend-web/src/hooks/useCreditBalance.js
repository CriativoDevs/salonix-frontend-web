import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import { useTenant } from './useTenant';

/**
 * Hook para obter saldo de créditos do tenant autenticado.
 * - Usa header `X-Tenant-Slug` quando disponível
 * - Faz fetch inicial e expõe método `refresh`
 * - Opcional: polling de fallback
 */
export default function useCreditBalance(options = {}) {
  const { pollIntervalMs = 0, enabled = true } = options;
  const { slug } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const headers = useMemo(() => {
    const h = {};
    if (slug) {
      h['X-Tenant-Slug'] = slug;
    }
    return h;
  }, [slug]);

  const fetchBalance = useCallback(async () => {
    if (!enabled) return;

    // --- TESTING MODE: Uncomment lines below to simulate balances ---
    // setData({ current_balance: 5, pending_balance: 0 }); // Low Balance (Warning)
    // setData({ current_balance: 0, pending_balance: 0 }); // Exhausted (Critical)
    // setLoading(false);
    // return;
    // -----------------------------------------------------------

    setLoading(true);
    setError(null);
    try {
      const resp = await client.get('users/credits/balance/', { headers });
      setData(resp?.data || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [headers, enabled]);

  useEffect(() => {
    fetchBalance();
    if (pollIntervalMs && pollIntervalMs > 0) {
      pollRef.current = setInterval(fetchBalance, pollIntervalMs);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchBalance, pollIntervalMs]);

  return {
    balance: data,
    loading,
    error,
    refresh: fetchBalance,
  };
}
