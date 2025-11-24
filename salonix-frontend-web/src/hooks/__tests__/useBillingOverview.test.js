/* eslint-env jest */

import { renderHook, act } from '@testing-library/react';
import useBillingOverview from '../useBillingOverview';
import * as api from '../../api/billingOverview';

jest.mock('../../api/billingOverview', () => ({
  fetchBillingOverview: jest.fn(),
}));

jest.mock('../useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

describe('useBillingOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega overview com slug', async () => {
    api.fetchBillingOverview.mockResolvedValueOnce({ credit_balance: 10, can_purchase_credits: true });

    const { result } = renderHook(() => useBillingOverview());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(api.fetchBillingOverview).toHaveBeenCalledWith({ slug: 'aurora' });
    expect(result.current.loading).toBe(false);
    expect(result.current.overview.credit_balance).toBe(10);
    expect(result.current.overview.can_purchase_credits).toBe(true);
  });
});
