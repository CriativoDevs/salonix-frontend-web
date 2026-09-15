import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Plans from '../Plans';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="full-page-layout">{children}</div>,
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

let mockTenant = {};
jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: mockTenant,
    plan: { tier: 'basic', name: 'Basic' },
    slug: 'aurora',
    refetch: jest.fn(),
  }),
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
  createBillingPortalSession: jest.fn(),
}));

describe('Plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenant = {};
  });

  it('disables the checkout button when the selected plan is not available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
        { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: false },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).toBeDisabled();
  });

  it('enables the checkout button when the selected plan is available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).not.toBeDisabled();
  });

  it('does not render a plan the backend omits from available_plans', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: true, can_upgrade: false },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    await screen.findByText('TimelyOne');
    expect(screen.queryByText('Founder')).not.toBeInTheDocument();
  });

  it('FEW-TRIAL-03: shows the trial-exhausted warning from tenant.is_trial_expired, not overview.trial_exhausted', async () => {
    mockTenant = { is_trial_expired: true };
    mockOverview = {
      // Deliberadamente sem trial_exhausted/trial_eligible: a fonte agora
      // é tenant.is_trial_expired (bootstrap), não mais o overview.
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    expect(await screen.findByText(/já foi utilizado/i)).toBeInTheDocument();
  });

  it('FEW-TRIAL-03: does not show the trial-exhausted warning when tenant.is_trial_expired is false', async () => {
    mockTenant = { is_trial_expired: false };
    mockOverview = {
      trial_exhausted: true,
      trial_eligible: false,
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    await screen.findByText('TimelyOne');
    expect(screen.queryByText(/já foi utilizado/i)).not.toBeInTheDocument();
  });
});
