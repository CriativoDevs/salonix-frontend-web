import client from './client';
import { parsePaginationHeaders } from './pagination';

export async function fetchSlots({ professionalId, slug, params } = {}) {
  // Painel do salão deve usar endpoint privado
  const headers = {};
  const searchParams = { ordering: '-start_time', is_available: true };
  const p = params || {};
  if (typeof p.limit === 'number') {
    searchParams.limit = p.limit;
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
  if (professionalId) {
    searchParams.professional_id = professionalId;
  }
  const { data } = await client.get('slots/', { headers, params: searchParams });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function fetchSlotsWithMeta({ professionalId, slug, params } = {}) {
  const headers = {};
  const searchParams = { ordering: '-start_time', is_available: true };
  const p = params || {};
  if (typeof p.limit === 'number') {
    searchParams.limit = p.limit;
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
  if (professionalId) {
    searchParams.professional_id = professionalId;
  }
  const response = await client.get('slots/', { headers, params: searchParams });
  const { data, headers: respHeaders } = response || {};
  const baseResults = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  const meta = parsePaginationHeaders(respHeaders);
  const count = meta.totalCount != null ? meta.totalCount : baseResults.length;
  return { results: baseResults, count, meta };
}

export async function createSlot({ professionalId, startTime, endTime, slug }) {
  const payload = {
    professional: Number.parseInt(professionalId, 10),
    start_time: startTime,
    end_time: endTime,
    is_available: true,
  };
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post('slots/', payload, { headers, params });
  return data;
}

export async function deleteSlot(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { status } = await client.delete(`slots/${id}/`, { headers, params });
  return status === 204;
}

export async function fetchSlotDetail(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get(`slots/${id}/`, { headers, params });
  return data;
}
