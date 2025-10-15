/* eslint-env jest */

import client from '../client';
import {
  fetchCustomers,
  fetchCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resendCustomerInvite,
} from '../customers';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('customers api', () => {
  it('fetchCustomers loads paginated list with tenant header', async () => {
    client.get.mockResolvedValueOnce({
      data: { results: [{ id: 1, name: 'Ana' }], count: 1 },
    });

    const payload = await fetchCustomers({ slug: 'default' });

    expect(client.get).toHaveBeenCalledWith('salon/customers/', {
      headers: { 'X-Tenant-Slug': 'default' },
      params: {
        page_size: 200,
        tenant: 'default',
      },
    });
    expect(payload.results).toHaveLength(1);
  });

  it('fetchCustomerDetail hits private endpoint with slug when provided', async () => {
    client.get.mockResolvedValueOnce({ data: { id: 4 } });

    await fetchCustomerDetail(4, { slug: 'default' });

    expect(client.get).toHaveBeenCalledWith('salon/customers/4/', {
      headers: { 'X-Tenant-Slug': 'default' },
      params: { tenant: 'default' },
    });
  });

  it('createCustomer posts payload to tenant scope', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 10 } });

    await createCustomer({ name: 'Cliente', email: 'a@b.c' }, { slug: 'default' });

    expect(client.post).toHaveBeenCalledWith(
      'salon/customers/',
      { name: 'Cliente', email: 'a@b.c' },
      { headers: { 'X-Tenant-Slug': 'default' } },
    );
  });

  it('updateCustomer patches resource', async () => {
    client.patch.mockResolvedValueOnce({ data: { id: 7, name: 'Atualizado' } });

    await updateCustomer(7, { name: 'Atualizado' }, { slug: 'default' });

    expect(client.patch).toHaveBeenCalledWith(
      'salon/customers/7/',
      { name: 'Atualizado' },
      { headers: { 'X-Tenant-Slug': 'default' } },
    );
  });

  it('deleteCustomer returns true when API responds 204', async () => {
    client.delete.mockResolvedValueOnce({ status: 204 });

    const removed = await deleteCustomer(8, { slug: 'default' });

    expect(client.delete).toHaveBeenCalledWith('salon/customers/8/', {
      headers: { 'X-Tenant-Slug': 'default' },
    });
    expect(removed).toBe(true);
  });

  it('resendCustomerInvite posts to invite endpoint with tenant scope', async () => {
    client.post.mockResolvedValueOnce({ data: { status: 'queued' } });

    await resendCustomerInvite(3, { slug: 'default' });

    expect(client.post).toHaveBeenCalledWith(
      'salon/customers/3/invite/',
      {},
      {
        headers: { 'X-Tenant-Slug': 'default' },
        params: { tenant: 'default' },
      },
    );
  });
});
