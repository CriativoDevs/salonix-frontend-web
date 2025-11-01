import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { fetchBasicReports, fetchAdvancedReports } from '../api/reports';
import { parseApiError } from '../utils/apiError';

const INITIAL_DATA = {
  basicReports: null,
  advancedReports: null,
};

// Cache global para evitar re-fetch desnecessário
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function getCacheKey(slug, type, filters) {
  return `${slug}-${type}-${JSON.stringify(filters || {})}`;
}

function getCachedData(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function useReportsData({ slug, type, filters } = {}) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const mountedRef = useRef(true);

  // Memoizar filtros para evitar re-renders desnecessários
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  const load = useCallback(async () => {
    if (!slug) {
      setData(INITIAL_DATA);
      setLoading(false);
      setInitialLoading(false);
      setError(null);
      setForbidden(false);
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    // Verificar cache primeiro
    const cacheKey = getCacheKey(slug, type, memoizedFilters);
    const cachedResult = getCachedData(cacheKey);
    
    if (cachedResult) {
      setData(cachedResult.data);
      setError(cachedResult.error);
      setForbidden(cachedResult.forbidden);
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      if (type === 'basic') {
        const result = await fetchBasicReports({ slug, ...memoizedFilters });
        if (!mountedRef.current) return;
        
        const newData = { ...INITIAL_DATA, basicReports: result };
        setData(newData);
        
        // Cache do resultado
        setCachedData(cacheKey, {
          data: newData,
          error: null,
          forbidden: false
        });
        
      } else if (type === 'advanced') {
        const result = await fetchAdvancedReports({ slug, ...memoizedFilters });
        if (!mountedRef.current) return;
        
        const newData = { ...INITIAL_DATA, advancedReports: result };
        setData(newData);
        
        // Cache do resultado
        setCachedData(cacheKey, {
          data: newData,
          error: null,
          forbidden: false
        });
        
      } else {
        // Carregar ambos quando type não é especificado ou é 'all'
        const [basicResult, advancedResult] = await Promise.allSettled([
          fetchBasicReports({ slug, ...memoizedFilters }),
          fetchAdvancedReports({ slug, ...memoizedFilters }),
        ]);

        if (!mountedRef.current) return;

        const nextData = { ...INITIAL_DATA };
        let hasError = null;
        let hasForbidden = false;

        if (basicResult.status === 'fulfilled') {
          nextData.basicReports = basicResult.value;
        } else {
          const status = basicResult.reason?.response?.status;
          if (status === 403) {
            hasForbidden = true;
          } else {
            hasError = basicResult.reason;
          }
        }

        if (advancedResult.status === 'fulfilled') {
          nextData.advancedReports = advancedResult.value;
        } else {
          const status = advancedResult.reason?.response?.status;
          if (status === 403) {
            hasForbidden = true;
          } else if (!hasError) {
            hasError = advancedResult.reason;
          }
        }

        setData(nextData);
        setForbidden(hasForbidden);

        const finalError = hasError ? parseApiError(hasError, 'Falha ao carregar os relatórios.') : null;
        setError(finalError);

        // Cache do resultado
        setCachedData(cacheKey, {
          data: nextData,
          error: finalError,
          forbidden: hasForbidden
        });

        setLoading(false);
        setInitialLoading(false);
        return;
      }

      setLoading(false);
      setInitialLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;

      const status = err?.response?.status;
      const isForbidden = status === 403;
      const parsed = parseApiError(err, 'Falha ao carregar os relatórios.');
      
      setForbidden(isForbidden);
      setError(parsed);
      
      // Cache do erro também
      setCachedData(cacheKey, {
        data: INITIAL_DATA,
        error: parsed,
        forbidden: isForbidden
      });
      
      setLoading(false);
      setInitialLoading(false);
    }
  }, [slug, type, memoizedFilters]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const refetch = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Limpar cache ao fazer refetch
    const cacheKey = getCacheKey(slug, type, memoizedFilters);
    cache.delete(cacheKey);
    
    load();
  }, [load, slug, type, memoizedFilters]);

  return {
    data,
    loading,
    initialLoading,
    error,
    forbidden,
    refetch,
  };
}

export default useReportsData;
