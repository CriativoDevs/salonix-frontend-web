import client from './client';

export async function fetchCreditPackages({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.get('payments/stripe/credits/packages/', {
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
    'payments/stripe/credits/purchase/',
    { amount_eur: amountEur },
    { headers, params }
  );
  return data;
}

export async function createCreditCheckoutSession(amountEur, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const { data } = await client.post(
    'payments/stripe/credits/checkout/',
    { amount_eur: amountEur },
    { headers, params }
  );
  return data; // { checkout_url, session_id }
}

export default {
  fetchCreditPackages,
  createCreditPaymentIntent,
  createCreditCheckoutSession,
};
