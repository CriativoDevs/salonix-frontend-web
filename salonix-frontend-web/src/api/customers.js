import client from './client';
import { parsePaginationHeaders } from './pagination';

const normalizePaginated = (data) => {
  if (!data) {
    return { results: [], count: 0, next: null, previous: null };
  }

  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }

  const { results, count, next, previous } = data;
  return {
    results: Array.isArray(results) ? results : [],
    count: typeof count === 'number' ? count : Array.isArray(results) ? results.length : 0,
    next: next || null,
    previous: previous || null,
  };
};

export async function fetchCustomers({ slug, params } = {}) {
  const headers = {};
  const searchParams = { page_size: 200 };
  const p = params || {};

  // Suporte a limit/offset/ordering com compatibilidade
  if (typeof p.limit === 'number') {
    searchParams.limit = p.limit;
    searchParams.page_size = p.limit;
  }
  if (typeof p.offset === 'number') {
    searchParams.offset = p.offset;
  }
  if (typeof p.ordering === 'string' && p.ordering.trim() !== '') {
    searchParams.ordering = p.ordering.trim();
  }
  Object.keys(p).forEach((k) => {
    if (searchParams[k] === undefined) searchParams[k] = p[k];
  });

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const response = await client.get('salon/customers/', {
    headers,
    params: searchParams,
  });
  const { data, headers: respHeaders } = response || {};
  const base = normalizePaginated(data);
  const meta = parsePaginationHeaders(respHeaders);
  const count = meta.totalCount != null ? meta.totalCount : base.count;
  return { ...base, count, meta };
}

export async function fetchCustomerDetail(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const { data } = await client.get(`salon/customers/${id}/`, {
    headers,
    params,
  });

  return data;
}

export async function createCustomer(payload, { slug } = {}) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  const { data } = await client.post('salon/customers/', payload, { headers });
  return data;
}

export async function updateCustomer(id, payload, { slug } = {}) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  const { data } = await client.patch(`salon/customers/${id}/`, payload, { headers });
  return data;
}

export async function deleteCustomer(id, { slug } = {}) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  const { status } = await client.delete(`salon/customers/${id}/`, { headers });
  return status === 204;
}

export async function resendCustomerInvite(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post(
    `salon/customers/${id}/invite/`,
    {},
    { headers, params },
  );
  return data;
}
