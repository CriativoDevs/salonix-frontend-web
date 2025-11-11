import client from './client';
import { parsePaginationHeaders } from './pagination';

const normaliseListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

export async function fetchProfessionals(slugOrOptions) {
  const headers = {};
  const searchParams = {};
  let slug;
  let params;

  if (typeof slugOrOptions === 'string') {
    slug = slugOrOptions;
  } else if (slugOrOptions && typeof slugOrOptions === 'object') {
    slug = slugOrOptions.slug;
    params = slugOrOptions.params;
  }

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
  const { data } = await client.get('professionals/', { headers, params: searchParams });
  return normaliseListResponse(data);
}

export async function fetchProfessionalsWithMeta(options = {}) {
  const headers = {};
  const searchParams = {};
  const { slug, params } = options || {};
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
  const response = await client.get('professionals/', { headers, params: searchParams });
  const { data, headers: respHeaders } = response || {};
  const results = normaliseListResponse(data);
  const meta = parsePaginationHeaders(respHeaders);
  const count = meta.totalCount != null ? meta.totalCount : results.length;
  return { results, count, meta };
}

export async function createProfessional({ name, specialty, phone, slug, staffMemberId }) {
  if (!staffMemberId) {
    throw new Error('staffMemberId é obrigatório para criar um profissional.');
  }

  const notes = [specialty, phone].filter(Boolean).join(' • ');
  const payload = {
    name: String(name || '').trim(),
    bio: notes || undefined,
    is_active: true,
    staff_member: staffMemberId,
  };

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const { data } = await client.post('professionals/', payload, { headers, params });
  return data;
}

export async function updateProfessional(id, { name, bio, is_active, staffMemberId, slug }) {
  const payload = {
    ...(name != null ? { name: String(name).trim() } : {}),
    ...(bio != null ? { bio: String(bio) } : {}),
    ...(is_active != null ? { is_active: Boolean(is_active) } : {}),
  };

  if (staffMemberId != null) {
    payload.staff_member = staffMemberId;
  }

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const { data } = await client.patch(`professionals/${id}/`, payload, { headers, params });
  return data;
}

export async function deleteProfessional(id, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { status } = await client.delete(`professionals/${id}/`, { headers, params });
  return status === 204;
}
