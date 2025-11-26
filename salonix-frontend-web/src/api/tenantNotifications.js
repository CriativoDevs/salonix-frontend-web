import client from './client';

export async function updateTenantNotifications(payload = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.patch('users/tenant/notifications/', payload, { headers, params });
  return data;
}

export default {
  updateTenantNotifications,
};
