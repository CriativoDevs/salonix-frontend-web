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
    count: typeof count === 'number' ? count : (Array.isArray(results) ? results.length : 0),
    next: next || null,
    previous: previous || null,
  };
};

export async function fetchAppointments({ slug, params } = {}) {
  const headers = {};
  const searchParams = { page_size: 20, ordering: '-created_at', ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }
  const { data } = await client.get('salon/appointments/', {
    headers,
    params: searchParams,
  });

  return normalizePaginated(data);
}

export async function fetchAppointmentDetail(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get(`appointments/${id}/`, { headers, params });
  return data;
}

export async function createAppointment(payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post('appointments/', payload, { headers, params });
  return data;
}

export async function updateAppointment(id, payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.patch(`salon/appointments/${id}/`, payload, { headers, params });
  return data;
}

export async function cancelAppointment(id, { slug } = {}) {
  return updateAppointment(id, { status: 'cancelled' }, { slug });
}
