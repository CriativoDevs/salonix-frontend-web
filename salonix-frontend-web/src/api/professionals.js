import client from './client';

export async function fetchProfessionals(slug) {
  // Listagem: usar endpoint público por tenant (traz todos ativos do salão)
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('public/professionals/', { headers, params });
  return Array.isArray(data) ? data : [];
}

export async function createProfessional({ name, specialty, phone, slug }) {
  // Backend aceita: name, bio, is_active
  const notes = [specialty, phone].filter(Boolean).join(' • ');
  const payload = {
    name: String(name || '').trim(),
    bio: notes || undefined,
    is_active: true,
  };
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  const { data } = await client.post('professionals/', payload, { headers });
  return data;
}

export async function updateProfessional(id, { name, bio, is_active }) {
  const payload = {
    ...(name != null ? { name: String(name).trim() } : {}),
    ...(bio != null ? { bio: String(bio) } : {}),
    ...(is_active != null ? { is_active: Boolean(is_active) } : {}),
  };
  const { data } = await client.patch(`professionals/${id}/`, payload);
  return data;
}

export async function deleteProfessional(id) {
  const { status } = await client.delete(`professionals/${id}/`);
  return status === 204;
}
