import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchDashboardOverview,
  fetchDashboardRevenueSeries,
  fetchDashboardBookings,
  fetchDashboardCustomers,
} from '../api/dashboard';
import { parseApiError } from '../utils/apiError';

const INITIAL_DATA = {
  overviewDaily: null,
  overviewMonthly: null,
  revenueSeries: null,
  bookings: null,
  customers: null,
};

export function useDashboardData({ slug, reportsEnabled = true } = {}) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportsForbidden, setReportsForbidden] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!slug) {
      setData(INITIAL_DATA);
      setLoading(false);
      setError(null);
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    setLoading(true);
    setError(null);
    setReportsForbidden(false);
    setData(INITIAL_DATA);

    const toApiDate = (date) => date.toISOString().replace('Z', '+00:00');

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const periodParams = {
      from: toApiDate(startOfDay),
      to: toApiDate(endOfDay),
    };

    const monthlyParams = {
      from: toApiDate(startOfMonth),
      to: toApiDate(now),
    };

    const requests = [
      {
        key: 'customers',
        promise: fetchDashboardCustomers({ slug, params: { page_size: 1 } }),
      },
      {
        key: 'bookings',
        promise: fetchDashboardBookings({
          slug,
          params: {
            date_from: periodParams.from,
            date_to: periodParams.to,
            ordering: 'slot_time',
            page_size: 200,
          },
        }),
      },
    ];

    if (reportsEnabled) {
      requests.push(
        {
          key: 'overviewDaily',
          promise: fetchDashboardOverview({
            slug,
            params: periodParams,
          }),
        },
        {
          key: 'overviewMonthly',
          promise: fetchDashboardOverview({
            slug,
            params: monthlyParams,
          }),
        },
        {
          key: 'revenueSeries',
          promise: fetchDashboardRevenueSeries({
            slug,
            interval: 'month',
            params: monthlyParams,
          }),
        }
      );
    }

    const results = await Promise.allSettled(requests.map((entry) => entry.promise));

    if (!mountedRef.current) {
      return;
    }

    const nextData = { ...INITIAL_DATA };
    let firstError = null;
    let forbidden = false;

    results.forEach((result, index) => {
      const { key } = requests[index];
      if (result.status === 'fulfilled') {
        nextData[key] = result.value;
      } else {
        const err = result.reason;
        const status = err?.response?.status;
        if (status === 403 && (key === 'overviewDaily' || key === 'overviewMonthly')) {
          forbidden = true;
        } else if (!firstError) {
          firstError = err;
        }
      }
    });

    setData(nextData);
    setReportsForbidden(forbidden);
    setError(firstError ? parseApiError(firstError, 'Falha ao carregar o dashboard.') : null);
    setLoading(false);
  }, [slug, reportsEnabled]);

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
    reportsForbidden,
    refetch,
  };
}

export default useDashboardData;
