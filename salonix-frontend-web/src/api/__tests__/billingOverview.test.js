/* eslint-env jest */

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import client from '../client';
import { updateAutoRenewal } from '../billingOverview';

describe('billingOverview api - updateAutoRenewal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('faz PATCH em payments/stripe/settings/ com auto_renewal', async () => {
    client.patch.mockResolvedValueOnce({ data: { auto_renewal: true } });

    const result = await updateAutoRenewal({
      autoRenewal: true,
      slug: 'aurora',
    });

    expect(client.patch).toHaveBeenCalledWith(
      'payments/stripe/settings/',
      { auto_renewal: true },
      { headers: { 'X-Tenant-Slug': 'aurora' } }
    );
    expect(result).toEqual({ auto_renewal: true });
  });

  it('nao envia header de tenant quando slug nao e fornecido', async () => {
    client.patch.mockResolvedValueOnce({ data: { auto_renewal: false } });

    await updateAutoRenewal({ autoRenewal: false });

    expect(client.patch).toHaveBeenCalledWith(
      'payments/stripe/settings/',
      { auto_renewal: false },
      { headers: {} }
    );
  });

  it('inclui auto_renewal_price_id no payload quando fornecido', async () => {
    client.patch.mockResolvedValueOnce({ data: { auto_renewal: true } });

    await updateAutoRenewal({
      autoRenewal: true,
      autoRenewalPriceId: 'price_credits_10',
      slug: 'aurora',
    });

    expect(client.patch).toHaveBeenCalledWith(
      'payments/stripe/settings/',
      { auto_renewal: true, auto_renewal_price_id: 'price_credits_10' },
      { headers: { 'X-Tenant-Slug': 'aurora' } }
    );
  });
});
