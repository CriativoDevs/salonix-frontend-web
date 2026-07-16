import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterCheckout from '../RegisterCheckout';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

let mockOverview;
jest.mock('../../hooks/useBillingOverview', () => () => ({
  overview: mockOverview,
  loading: false,
  refresh: jest.fn(),
}));

jest.mock('../../api/billing', () => ({
  PLAN_OPTIONS: [
    { code: 'basic', name: 'TimelyOne', price: '€29', highlights: [] },
    { code: 'founder', name: 'Founder', price: '€15', highlights: [] },
  ],
  createCheckoutSession: jest.fn(),
}));

describe('RegisterCheckout', () => {
  it('disables checkout when the selected plan is unavailable', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).toBeDisabled();
  });

  it('enables checkout when the selected plan is available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).not.toBeDisabled();
  });
});
