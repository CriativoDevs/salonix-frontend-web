import client from './client';

export async function fetchBillingOverview({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('payments/stripe/overview/', { headers, params });
  return data;
}

export async function updateSubscriptionAction({ action, slug }) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  const { data } = await client.post(
    'payments/stripe/subscription/action/',
    { action },
    { headers }
  );
  return data;
}

export default {
  fetchBillingOverview,
  updateSubscriptionAction,
};
