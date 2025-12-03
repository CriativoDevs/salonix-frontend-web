/* eslint-env jest */

import client from '../client';
import { updateTenantContact } from '../tenant';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('tenant api', () => {
  it('updateTenantContact envia email/phone para endpoint de perfil', async () => {
    client.patch.mockResolvedValueOnce({ data: { profile: { email: 'x@y', phone: '+3519' } } });

    const resp = await updateTenantContact({ email: 'x@y', phone: '+3519' });

    expect(client.patch).toHaveBeenCalledWith('users/tenant/profile/', {
      email: 'x@y',
      phone: '+3519',
    });
    expect(resp.profile.email).toBe('x@y');
  });
});

