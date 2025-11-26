import client from './client';

export async function fetchCreditPackages({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('payments/credits/packages/', {
    headers,
    params,
  });
  return data?.packages || [];
}

export async function createCreditPaymentIntent(amountEur, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post(
    'payments/credits/purchase/',
    { amount_eur: amountEur },
    { headers, params }
  );
  return data;
}

export default {
  fetchCreditPackages,
  createCreditPaymentIntent,
};
