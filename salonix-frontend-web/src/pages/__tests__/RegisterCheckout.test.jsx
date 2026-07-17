import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterCheckout from '../RegisterCheckout';
import { createCheckoutSession } from '../../api/billing';

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

  it('renders the single plan returned by the backend as a static, non-clickable card', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const planName = await screen.findByText('Founder');
    // The plan card must not be a clickable element anymore.
    expect(planName.closest('button')).toBeNull();

    // Only the plan the backend returned is shown — the other PLAN_OPTIONS entry
    // (basic) that mergePlanAvailability filtered out must not be rendered.
    expect(screen.queryByText('TimelyOne')).not.toBeInTheDocument();
  });

  it('keeps checking out the only available plan even if the plan card area is clicked', async () => {
    createCheckoutSession.mockClear();
    createCheckoutSession.mockResolvedValue({ url: 'https://checkout.example/session' });

    mockOverview = {
      available_plans: [
        { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const planName = await screen.findByText('Founder');
    // Clicking the plan card must not throw/change anything since there is no
    // plan-switching UI left; the checkout call still targets 'founder'.
    planName.click();

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    await act(async () => {
      continueBtn.click();
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      'founder',
      expect.objectContaining({ slug: 'aurora' })
    );
  });
});
