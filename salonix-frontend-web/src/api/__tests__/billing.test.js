/* eslint-env jest */

import client from '../client';
import { createCheckoutSession, createBillingPortalSession } from '../billing';

jest.mock('../client', () => ({
  post: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('billing api', () => {
  it('createCheckoutSession hits stripe endpoint with tenant headers', async () => {
    client.post.mockResolvedValueOnce({
      data: { checkout_url: 'https://stripe.example/checkout' },
    });

    const payload = await createCheckoutSession('standard', { slug: 'aurora' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/create-checkout-session/',
      { plan: 'standard' },
      { headers: { 'X-Tenant-Slug': 'aurora' }, params: { tenant: 'aurora' } }
    );
    expect(payload.url).toBe('https://stripe.example/checkout');
  });

  it('createBillingPortalSession posts to stripe portal endpoint', async () => {
    client.post.mockResolvedValueOnce({
      data: { portal_url: 'https://stripe.example/portal' },
    });
    const payload = await createBillingPortalSession({ slug: 'aurora' });
    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/billing-portal/',
      {},
      { headers: { 'X-Tenant-Slug': 'aurora' }, params: { tenant: 'aurora' } }
    );
    expect(payload.url).toBe('https://stripe.example/portal');
  });
});
