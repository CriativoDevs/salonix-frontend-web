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
