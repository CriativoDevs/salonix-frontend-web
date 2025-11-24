import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from './useTenant';
import { fetchBillingOverview } from '../api/billingOverview';

export default function useBillingOverview(options = {}) {
  const { enabled = true, pollIntervalMs = 0 } = options;
  const { slug } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchBillingOverview({ slug });
      setData(payload || null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [enabled, slug]);

  useEffect(() => {
    load();
    if (pollIntervalMs && pollIntervalMs > 0) {
      pollRef.current = setInterval(load, pollIntervalMs);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [load, pollIntervalMs]);

  const overview = useMemo(() => {
    return data || null;
  }, [data]);

  return { overview, loading, error, refresh: load };
}
