/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanOnboarding from '../PlanOnboarding';
import * as billingApi from '../../api/billing';
import * as safeRedirectUtils from '../../utils/safeRedirect';
import * as usersApi from '../../api/users';

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

jest.mock('../../api/users', () => ({
  checkFounderAvailability: jest.fn(async () => ({
    available: false,
  })),
}));

jest.mock('../../utils/safeRedirect', () => ({
  safeRedirect: jest.fn(),
  isRedirectValidationError: jest.fn(),
  REDIRECT_VALIDATION_ERROR_CODE: 'REDIRECT_URL_BLOCKED',
}));

describe('PlanOnboarding', () => {
  const originalError = console.error;

  beforeAll(() => {
    console.error = (...args) => {
      if (/Not implemented: navigation/.test(args[0])) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    safeRedirectUtils.safeRedirect.mockReset();
    safeRedirectUtils.isRedirectValidationError.mockReset();
    safeRedirectUtils.isRedirectValidationError.mockReturnValue(false);
    usersApi.checkFounderAvailability.mockResolvedValue({ available: false });
    billingApi.createCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });
  });

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
      expect(safeRedirectUtils.safeRedirect).toHaveBeenCalledWith(
        'https://checkout.stripe.com/pay/cs_test_123'
      );
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

  it('mostra erro amigável quando o redirect é bloqueado', async () => {
    const redirectError = new TypeError('Redirect URL failed validation.');
    redirectError.code = 'REDIRECT_URL_BLOCKED';

    safeRedirectUtils.safeRedirect.mockImplementation(() => {
      throw redirectError;
    });
    safeRedirectUtils.isRedirectValidationError.mockImplementation(
      (error) => error?.code === 'REDIRECT_URL_BLOCKED'
    );

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

    expect(
      await screen.findByText(
        /Não foi possível abrir o checkout com segurança/i
      )
    ).toBeInTheDocument();
  });
});
