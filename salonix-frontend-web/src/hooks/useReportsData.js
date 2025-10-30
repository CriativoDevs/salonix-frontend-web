import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBasicReports, fetchAdvancedReports } from '../api/reports';
import { parseApiError } from '../utils/apiError';

const INITIAL_DATA = {
  basicReports: null,
  advancedReports: null,
};

export function useReportsData({ slug, type } = {}) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!slug) {
      setData(INITIAL_DATA);
      setLoading(false);
      setError(null);
      setForbidden(false);
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      if (type === 'basic') {
        const result = await fetchBasicReports({ slug });
        if (!mountedRef.current) return;
        setData(prev => ({ ...prev, basicReports: result }));
      } else if (type === 'advanced') {
        const result = await fetchAdvancedReports({ slug });
        if (!mountedRef.current) return;
        setData(prev => ({ ...prev, advancedReports: result }));
      } else {
        // Carregar ambos quando type não é especificado ou é 'all'
        const [basicResult, advancedResult] = await Promise.allSettled([
          fetchBasicReports({ slug }),
          fetchAdvancedReports({ slug })
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
        
        if (hasError) {
          setError(parseApiError(hasError, 'Falha ao carregar os relatórios.'));
        }
        
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;
      
      const status = err?.response?.status;
      setForbidden(status === 403);
      const parsed = parseApiError(err, 'Falha ao carregar os relatórios.');
      setError(parsed);
      setLoading(false);
    }
  }, [slug, type]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const refetch = useCallback(() => {
    if (!mountedRef.current) return;
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    forbidden,
    refetch,
  };
}

export default useReportsData;