import client from './client';

function normalizeListResponse(payload) {
  if (!payload) {
    return { results: [], count: 0 };
  }

  if (Array.isArray(payload)) {
    const list = payload.filter(Boolean);
    return { results: list, count: list.length };
  }

  const results = Array.isArray(payload.results) ? payload.results.filter(Boolean) : [];
  const count =
    typeof payload.count === 'number' && Number.isFinite(payload.count)
      ? payload.count
      : results.length;

  return {
    ...payload,
    results,
    count,
  };
}

export async function fetchDashboardOverview({ slug, params } = {}) {
  const headers = {};
  const searchParams = { ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const { data } = await client.get('reports/overview/', {
    headers,
    params: searchParams,
  });

  return data;
}

export async function fetchDashboardRevenueSeries({ slug, interval = 'month', params } = {}) {
  const headers = {};
  const searchParams = { interval, ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const { data } = await client.get('reports/revenue/', {
    headers,
    params: searchParams,
  });

  return data;
}

export async function fetchDashboardBookings({ slug, params } = {}) {
  const headers = {};
  const searchParams = { ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const { data } = await client.get('salon/appointments/', {
    headers,
    params: searchParams,
  });

  return normalizeListResponse(data);
}

export async function fetchDashboardCustomers({ slug, params } = {}) {
  const headers = {};
  const searchParams = { ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const { data } = await client.get('salon/customers/', {
    headers,
    params: searchParams,
  });

  return normalizeListResponse(data);
}

export default {
  fetchDashboardOverview,
  fetchDashboardRevenueSeries,
  fetchDashboardBookings,
  fetchDashboardCustomers,
};
