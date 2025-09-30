import client from './client';

export async function fetchServices(slug) {
  // Listagem: usar endpoint público por tenant (traz todos do salão)
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('public/services/', { headers, params });
  return Array.isArray(data) ? data : [];
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
