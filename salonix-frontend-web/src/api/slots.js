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

