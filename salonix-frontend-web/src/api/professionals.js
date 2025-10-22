import client from './client';

const normaliseListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

export async function fetchProfessionals(slug) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('professionals/', { headers, params });
  return normaliseListResponse(data);
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
