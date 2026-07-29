import client from './client';

export async function fetchBillingOverview({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('payments/stripe/overview/', {
    headers,
    params,
  });
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

export async function updateAutoRenewal({ autoRenewal, autoRenewalPriceId, slug }) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  const payload = { auto_renewal: autoRenewal };
  if (autoRenewalPriceId) {
    payload.auto_renewal_price_id = autoRenewalPriceId;
  }
  const { data } = await client.patch('payments/stripe/settings/', payload, {
    headers,
  });
  return data;
}

export default {
  fetchBillingOverview,
  updateSubscriptionAction,
  updateAutoRenewal,
};
