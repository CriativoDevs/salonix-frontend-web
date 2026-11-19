/* eslint-env jest */

import client from '../client';
import { updateTenantContact, updateTenantBranding } from '../tenant';

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

  it('updateTenantBranding envia business_type no payload JSON', async () => {
    client.patch.mockResolvedValueOnce({ data: { business_type: 'psychology' } });

    await updateTenantBranding({ businessType: 'psychology' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/meta/',
      expect.objectContaining({ business_type: 'psychology' })
    );
  });

  it('updateTenantBranding envia business_type junto do arquivo de logo', async () => {
    client.patch.mockResolvedValueOnce({ data: {} });
    const file = new File(['x'], 'logo.png', { type: 'image/png' });

    await updateTenantBranding({ logoFile: file, businessType: 'tattoo' });

    const formData = client.patch.mock.calls[0][1];
    expect(formData.get('business_type')).toBe('tattoo');
  });

  it('updateTenantBranding omite business_type quando nao informado', async () => {
    client.patch.mockResolvedValueOnce({ data: {} });

    await updateTenantBranding({ addressCity: 'Lisboa' });

    expect(client.patch.mock.calls[0][1]).not.toHaveProperty('business_type');
  });
});
