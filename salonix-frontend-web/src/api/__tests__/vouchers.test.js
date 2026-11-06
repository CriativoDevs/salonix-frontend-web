/* eslint-env jest */

import client from '../client';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  assignVoucher,
  sendVoucherEmail,
  fetchCustomerVouchers,
} from '../vouchers';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('vouchers api', () => {
  it('fetchVouchers lists vouchers with tenant header', async () => {
    client.get.mockResolvedValueOnce({
      data: [{ id: 1, code: 'ABC12345', type: 'percent', value: '10.00' }],
    });

    const vouchers = await fetchVouchers({ slug: 'default' });

    expect(client.get).toHaveBeenCalledWith('vouchers/', {
      headers: { 'X-Tenant-Slug': 'default' },
    });
    expect(vouchers).toHaveLength(1);
  });

  it('fetchVouchers normalizes paginated response shape', async () => {
    client.get.mockResolvedValueOnce({
      data: { results: [{ id: 2 }], count: 1 },
    });

    const vouchers = await fetchVouchers({ slug: 'default' });

    expect(vouchers).toEqual([{ id: 2 }]);
  });

  it('createVoucher posts payload to tenant scope', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 1 } });

    await createVoucher(
      { type: 'percent', value: '10', max_uses: 1 },
      { slug: 'default' }
    );

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/',
      { type: 'percent', value: '10', max_uses: 1 },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('updateVoucher patches the resource', async () => {
    client.patch.mockResolvedValueOnce({ data: { id: 1, notes: 'novo' } });

    await updateVoucher(1, { notes: 'novo' }, { slug: 'default' });

    expect(client.patch).toHaveBeenCalledWith(
      'vouchers/1/',
      { notes: 'novo' },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('deleteVoucher returns true on 204', async () => {
    client.delete.mockResolvedValueOnce({ status: 204 });

    const removed = await deleteVoucher(1, { slug: 'default' });

    expect(client.delete).toHaveBeenCalledWith('vouchers/1/', {
      headers: { 'X-Tenant-Slug': 'default' },
    });
    expect(removed).toBe(true);
  });

  it('assignVoucher posts client_id to the assign action', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 5, client: 9 } });

    await assignVoucher(1, 9, { slug: 'default' });

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/1/assign/',
      { client_id: 9 },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('sendVoucherEmail posts client_id to the send-email action', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 5, client: 9 } });

    await sendVoucherEmail(1, 9, { slug: 'default' });

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/1/send-email/',
      { client_id: 9 },
      { headers: { 'X-Tenant-Slug': 'default' } }
    );
  });

  it('fetchCustomerVouchers lists vouchers assigned to a customer', async () => {
    client.get.mockResolvedValueOnce({
      data: [{ id: 1, voucher_code: 'ABC12345', status: 'active' }],
    });

    const vouchers = await fetchCustomerVouchers(9, { slug: 'default' });

    expect(client.get).toHaveBeenCalledWith('salon/customers/9/vouchers/', {
      headers: { 'X-Tenant-Slug': 'default' },
    });
    expect(vouchers).toHaveLength(1);
  });
});
