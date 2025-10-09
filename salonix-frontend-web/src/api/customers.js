import client from './client';

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
  const searchParams = {
    page_size: 200,
    ordering: 'name',
    ...(params || {}),
  };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }

  const { data } = await client.get('salon/customers/', {
    headers,
    params: searchParams,
  });

  return normalizePaginated(data);
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

