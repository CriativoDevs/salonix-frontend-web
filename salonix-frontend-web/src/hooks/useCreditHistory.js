import { useCallback, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useTenant } from './useTenant';

/**
 * Hook para obter histórico de transações de créditos.
 */
export default function useCreditHistory(options = {}) {
  const { enabled = true, pageSize = 10 } = options;
  const { slug } = useTenant();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = useMemo(() => {
    const h = {};
    if (slug) {
      h['X-Tenant-Slug'] = slug;
    }
    return h;
  }, [slug]);

  const fetchHistory = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };

      // Limpa params vazios
      Object.keys(params).forEach((key) => {
        if (
          params[key] === null ||
          params[key] === undefined ||
          params[key] === ''
        ) {
          delete params[key];
        }
      });

      const resp = await client.get('users/credits/history/', {
        headers,
        params,
      });
      const raw = resp?.data;

      if (raw && typeof raw === 'object' && 'results' in raw) {
        setData(raw.results || []);
        setMeta({
          count: raw.count || 0,
          next: raw.next,
          previous: raw.previous,
        });
      } else if (Array.isArray(raw)) {
        // Fallback caso o backend não retorne paginado
        setData(raw);
        setMeta({ count: raw.length, next: null, previous: null });
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [headers, enabled, page, pageSize, filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history: data,
    meta,
    page,
    setPage,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchHistory,
  };
}
