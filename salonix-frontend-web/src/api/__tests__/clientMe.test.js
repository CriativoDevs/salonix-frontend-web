/* eslint-env jest */

import client from '../client';
import {
  fetchClientVouchers,
  applyClientVoucherToAppointment,
} from '../clientMe';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('clientMe vouchers api (BE-VOUCHER-06)', () => {
  it('fetchClientVouchers lists the vouchers assigned to the logged-in client', async () => {
    client.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          voucher: 10,
          voucher_code: 'ABC12345',
          voucher_type: 'percent',
          voucher_value: '10.00',
          status: 'active',
        },
      ],
    });

    const vouchers = await fetchClientVouchers();

    expect(client.get).toHaveBeenCalledWith('clients/me/vouchers/');
    expect(vouchers).toHaveLength(1);
  });

  it('fetchClientVouchers returns an empty array when the response is not an array', async () => {
    client.get.mockResolvedValueOnce({ data: null });

    const vouchers = await fetchClientVouchers();

    expect(vouchers).toEqual([]);
  });

  it('applyClientVoucherToAppointment posts client_voucher_id to the apply-voucher action', async () => {
    client.post.mockResolvedValueOnce({
      data: { id: 1, status: 'used' },
    });

    await applyClientVoucherToAppointment(55, 1);

    expect(client.post).toHaveBeenCalledWith(
      'clients/me/appointments/55/apply-voucher/',
      { client_voucher_id: 1 }
    );
  });
});
