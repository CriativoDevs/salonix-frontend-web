import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OnboardingGuard from '../OnboardingGuard';
import * as useTenantHook from '../../hooks/useTenant';

// Mock useTenant
jest.mock('../../hooks/useTenant');

describe('OnboardingGuard', () => {
  const mockUseTenant = useTenantHook.useTenant;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  const renderGuard = (initialEntries = ['/dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <OnboardingGuard>
                <TestComponent />
              </OnboardingGuard>
            }
          />
          <Route path="/setup" element={<div>Setup Page</div>} />
          <Route path="/onboarding/plan" element={<div>Plan Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('allows access to dashboard when state is completed', () => {
    mockUseTenant.mockReturnValue({
      tenant: { onboarding_state: 'completed' },
      loading: false,
    });

    renderGuard(['/dashboard']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /setup when state is setup_pending', () => {
    mockUseTenant.mockReturnValue({
      tenant: { onboarding_state: 'setup_pending' },
      loading: false,
    });

    renderGuard(['/dashboard']);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Setup Page')).toBeInTheDocument();
  });

  it('redirects to /onboarding/plan when state is billing_pending', () => {
    mockUseTenant.mockReturnValue({
      tenant: { onboarding_state: 'billing_pending' },
      loading: false,
    });

    renderGuard(['/dashboard']);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Plan Page')).toBeInTheDocument();
  });
});
