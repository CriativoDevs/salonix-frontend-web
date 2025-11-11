import client from './client';
import { parsePaginationHeaders } from './pagination';

export async function fetchServices(slugOrOptions) {
  // Listagem: usar endpoint público por tenant (traz todos do salão)
  const headers = {};
  let slug;
  let params;
  if (typeof slugOrOptions === 'string') {
    slug = slugOrOptions;
  } else if (slugOrOptions && typeof slugOrOptions === 'object') {
    slug = slugOrOptions.slug;
    params = slugOrOptions.params;
  }
  const searchParams = {};
  const p = params || {};
  // Suporte a paginação e ordenação (quando disponível)
  if (typeof p.limit === 'number') searchParams.limit = p.limit;
  if (typeof p.offset === 'number') searchParams.offset = p.offset;
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
  const { data } = await client.get('public/services/', { headers, params: searchParams });
  return Array.isArray(data) ? data : [];
}

export async function fetchServicesWithMeta(slugOrOptions = {}) {
  const headers = {};
  let slug;
  let params;
  if (typeof slugOrOptions === 'string') {
    slug = slugOrOptions;
  } else if (slugOrOptions && typeof slugOrOptions === 'object') {
    slug = slugOrOptions.slug;
    params = slugOrOptions.params;
  }
  const searchParams = {};
  const p = params || {};
  if (typeof p.limit === 'number') searchParams.limit = p.limit;
  if (typeof p.offset === 'number') searchParams.offset = p.offset;
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
  const response = await client.get('public/services/', { headers, params: searchParams });
  const { data, headers: respHeaders } = response || {};
  const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  const meta = parsePaginationHeaders(respHeaders);
  const count = meta.totalCount != null ? meta.totalCount : results.length;
  return { results, count, meta };
}

export async function createService({ name, price, duration, slug }) {
  // Backend espera: name, price_eur (string decimal), duration_minutes (int)
  const payload = {
    name: String(name || '').trim(),
    price_eur: price != null ? String(price) : '0',
    duration_minutes: Number.parseInt(duration ?? 0, 10) || 0,
  };
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  const { data } = await client.post('services/', payload, { headers });
  return data;
}

export async function updateService(id, { name, price_eur, duration_minutes }) {
  const payload = {
    ...(name != null ? { name: String(name).trim() } : {}),
    ...(price_eur != null ? { price_eur: String(price_eur) } : {}),
    ...(duration_minutes != null
      ? { duration_minutes: Number.parseInt(duration_minutes, 10) || 0 }
      : {}),
  };
  const { data } = await client.patch(`services/${id}/`, payload);
  return data;
}

export async function deleteService(id) {
  const { status } = await client.delete(`services/${id}/`);
  return status === 204;
}
