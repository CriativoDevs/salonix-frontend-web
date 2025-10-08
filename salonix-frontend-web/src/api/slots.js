import client from './client';

export async function fetchSlots({ professionalId, slug }) {
  // Painel do salão deve usar endpoint privado
  const headers = {};
  const params = { ordering: '-start_time', is_available: true, page_size: 200 };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (professionalId) {
    params.professional_id = professionalId;
  }
  const { data } = await client.get('slots/', { headers, params });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function createSlot({ professionalId, startTime, endTime, slug }) {
  const payload = {
    professional: Number.parseInt(professionalId, 10),
    start_time: startTime,
    end_time: endTime,
    is_available: true,
  };
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  const { data } = await client.post('slots/', payload, { headers });
  return data;
}

export async function deleteSlot(id, { slug } = {}) {
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  const { status } = await client.delete(`slots/${id}/`, { headers });
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
