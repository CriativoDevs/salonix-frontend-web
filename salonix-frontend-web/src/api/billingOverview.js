import client from './client';

export async function fetchBillingOverview({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('payments/overview/', { headers, params });
  return data;
}

export default {
  fetchBillingOverview,
};
