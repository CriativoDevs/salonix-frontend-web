/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanOnboarding from '../PlanOnboarding';
import * as billingApi from '../../api/billing';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    plan: { tier: 'basic', name: 'Basic' },
    slug: 'aurora',
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/useBillingOverview', () => {
  const state = { overview: null, loading: false, refresh: jest.fn() };
  return () => state;
});

jest.mock('../../api/billing', () => ({
  PLAN_OPTIONS: [
    { code: 'basic', name: 'Basic' },
    { code: 'standard', name: 'Standard' },
    { code: 'pro', name: 'Pro' },
  ],
  createCheckoutSession: jest.fn(async () => ({
    url: '/checkout/mock?plan=standard',
  })),
}));

describe('PlanOnboarding', () => {
  it('abre modal de confirmação e inicia checkout ao confirmar', async () => {
    render(
      <MemoryRouter>
        <PlanOnboarding />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    fireEvent.click(continueBtn);

    const confirmInModal = await screen.findAllByText(
      /Continuar para checkout/i
    );
    fireEvent.click(confirmInModal[confirmInModal.length - 1]);

    await waitFor(() => {
      expect(billingApi.createCheckoutSession).toHaveBeenCalled();
    });
  });

  it('persiste progresso no localStorage ao confirmar', async () => {
    render(
      <MemoryRouter>
        <PlanOnboarding />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    fireEvent.click(continueBtn);
    const confirmInModal = await screen.findAllByText(
      /Continuar para checkout/i
    );
    fireEvent.click(confirmInModal[confirmInModal.length - 1]);

    await waitFor(() => {
      const stored = window.localStorage.getItem('onboarding.plan.selection');
      expect(stored).toBeTruthy();
    });
  });
});
