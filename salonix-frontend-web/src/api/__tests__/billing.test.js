/* eslint-env jest */

import client from '../client';
import { createCheckoutSession, createBillingPortalSession } from '../billing';
import { resetEnvCache } from '../../utils/env';

jest.mock('../client', () => ({
  post: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.process = globalThis.process || {};
  globalThis.process.env = globalThis.process.env || {};
  delete globalThis.process.env.VITE_BILLING_MOCK;
  resetEnvCache();
});

describe('billing api', () => {
  it('createCheckoutSession hits stripe endpoint with tenant headers', async () => {
    client.post.mockResolvedValueOnce({ data: { checkout_url: 'https://stripe.example/checkout' } });

    const payload = await createCheckoutSession('standard', { slug: 'aurora' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/create-checkout-session/',
      { plan: 'standard' },
      { headers: { 'X-Tenant-Slug': 'aurora' }, params: { tenant: 'aurora' } }
    );
    expect(payload.url).toBe('https://stripe.example/checkout');
  });

  it('createCheckoutSession falls back to legacy endpoints on 404', async () => {
    const err404 = Object.assign(new Error('Not found'), { response: { status: 404 } });
    client.post
      .mockRejectedValueOnce(err404)
      .mockResolvedValueOnce({ data: { checkout_url: '/legacy/checkout' } });

    const payload = await createCheckoutSession('basic', { slug: 'default' });
    expect(client.post).toHaveBeenNthCalledWith(
      1,
      'payments/stripe/create-checkout-session/',
      { plan: 'basic' },
      { headers: { 'X-Tenant-Slug': 'default' }, params: { tenant: 'default' } }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      'payments/checkout/',
      { plan: 'basic' },
      { headers: { 'X-Tenant-Slug': 'default' }, params: { tenant: 'default' } }
    );
    expect(payload.url).toBe('/legacy/checkout');
  });

  it('createCheckoutSession cascades to final fallback endpoint', async () => {
    const err404 = Object.assign(new Error('Not found'), { response: { status: 404 } });
    client.post
      .mockRejectedValueOnce(err404)
      .mockRejectedValueOnce(err404)
      .mockResolvedValueOnce({ data: { url: '/final/session' } });

    const payload = await createCheckoutSession('pro', { slug: 'aurora' });
    expect(client.post).toHaveBeenNthCalledWith(3, 'payments/checkout/session/', { plan: 'pro' }, { headers: { 'X-Tenant-Slug': 'aurora' }, params: { tenant: 'aurora' } });
    expect(payload.url).toBe('/final/session');
  });

  it('createCheckoutSession returns mock url when VITE_BILLING_MOCK=true', async () => {
    globalThis.process.env.VITE_BILLING_MOCK = 'true';
    resetEnvCache();
    const payload = await createCheckoutSession('standard', { slug: 'aurora' });
    expect(payload.url).toMatch(/\/checkout\/mock\?plan=standard/);
    expect(client.post).not.toHaveBeenCalled();
  });

  it('createBillingPortalSession posts to stripe portal endpoint', async () => {
    client.post.mockResolvedValueOnce({ data: { portal_url: 'https://stripe.example/portal' } });
    const payload = await createBillingPortalSession({ slug: 'aurora' });
    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/billing-portal/',
      {},
      { headers: { 'X-Tenant-Slug': 'aurora' }, params: { tenant: 'aurora' } }
    );
    expect(payload.url).toBe('https://stripe.example/portal');
  });

  it('createBillingPortalSession returns mock portal when VITE_BILLING_MOCK=true', async () => {
    globalThis.process.env.VITE_BILLING_MOCK = 'true';
    resetEnvCache();
    const payload = await createBillingPortalSession({ slug: 'aurora' });
    expect(payload.url).toBe('/billing/mock/portal');
    expect(client.post).not.toHaveBeenCalled();
  });
});

