import client from './client';

export async function fetchSlots({ professionalId, slug }) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (professionalId) {
    params.professional_id = professionalId;
  }
  const { data } = await client.get('public/slots/', { headers, params });
  return Array.isArray(data) ? data : [];
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
