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
    count: typeof count === 'number' ? count : (Array.isArray(results) ? results.length : 0),
    next: next || null,
    previous: previous || null,
  };
};

export async function fetchAppointments({ slug, params } = {}) {
  const headers = {};
  const searchParams = { page_size: 20, ordering: '-created_at' };
  const p = params || {};

  // Compatibilidade: aceitar limit/offset/ordering e manter page_size/order atuais
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
  // Copiar demais params (status, date_from, etc.) sem sobrescrever os já definidos
  Object.keys(p).forEach((k) => {
    if (searchParams[k] === undefined) searchParams[k] = p[k];
  });

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }
  const response = await client.get('salon/appointments/', {
    headers,
    params: searchParams,
  });
  const { data, headers: respHeaders } = response || {};
  const base = normalizePaginated(data);
  const meta = parsePaginationHeaders(respHeaders);
  // Se houver totalCount nos headers, preferir sobre count do payload
  const count = meta.totalCount != null ? meta.totalCount : base.count;
  return { ...base, count, meta };
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

// Criação de múltiplos agendamentos em lote (mistura de profissional/serviço possível)
export async function createAppointmentsBulk(payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post('appointments/bulk/', payload, { headers, params });
  return data;
}

// Criação de múltiplos agendamentos (Mixed Bulk): itens com profissionais/serviços diferentes
export async function createAppointmentsMixedBulk(payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post('appointments/bulk/mixed/', payload, { headers, params });
  return data;
}

// Criação de série de agendamentos (mesmo profissional/serviço)
export async function createAppointmentsSeries(payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post('appointments/series/', payload, { headers, params });
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
