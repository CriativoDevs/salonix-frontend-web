/* eslint-env jest */

import client from '../client';
import {
  fetchCustomers,
  fetchCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resendCustomerInvite,
  importCustomersCSV,
  fetchCustomersImportTemplate,
  exportCustomersCSV,
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

    await createCustomer(
      { name: 'Cliente', email: 'a@b.c' },
      { slug: 'default' }
    );

    expect(client.post).toHaveBeenCalledWith(
      'salon/customers/',
      { name: 'Cliente', email: 'a@b.c' },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('createCustomer uses multipart when photo file is present', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 11 } });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await createCustomer(
      { name: 'Cliente', email: 'a@b.c', photo: file },
      { slug: 'default' }
    );

    expect(client.post).toHaveBeenCalledWith(
      'salon/customers/',
      expect.any(FormData),
      {
        headers: {
          'X-Tenant-Slug': 'default',
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  });

  it('updateCustomer patches resource', async () => {
    client.patch.mockResolvedValueOnce({ data: { id: 7, name: 'Atualizado' } });

    await updateCustomer(7, { name: 'Atualizado' }, { slug: 'default' });

    expect(client.patch).toHaveBeenCalledWith(
      'salon/customers/7/',
      { name: 'Atualizado' },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('updateCustomer uses multipart when photo file is present', async () => {
    client.patch.mockResolvedValueOnce({ data: { id: 7, name: 'Atualizado' } });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await updateCustomer(7, { photo: file }, { slug: 'default' });

    expect(client.patch).toHaveBeenCalledWith(
      'salon/customers/7/',
      expect.any(FormData),
      {
        headers: {
          'X-Tenant-Slug': 'default',
          'Content-Type': 'multipart/form-data',
        },
      }
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
      }
    );
  });
});

describe('customers import/export', () => {
  it('importCustomersCSV posts the file as multipart with dry_run query param', async () => {
    const file = new File(['a,b\n1,2'], 'customers.csv', { type: 'text/csv' });
    client.post.mockResolvedValueOnce({
      data: { summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const resp = await importCustomersCSV(file, { dryRun: true, slug: 'salon-x' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe('import/customers/');
    expect(body.get('file')).toBe(file);
    expect(config).toEqual({
      headers: { 'X-Tenant-Slug': 'salon-x', 'Content-Type': 'multipart/form-data' },
      params: { dry_run: 'true', tenant: 'salon-x' },
    });
    expect(resp.summary.created).toBe(1);
  });

  it('fetchCustomersImportTemplate downloads the CSV template as a blob', async () => {
    const blob = new Blob(['name,email,phone']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await fetchCustomersImportTemplate({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('import/templates/customers.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('exportCustomersCSV downloads the customers export as a blob', async () => {
    const blob = new Blob(['id,name']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await exportCustomersCSV({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('export/customers.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
