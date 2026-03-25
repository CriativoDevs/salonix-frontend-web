import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
// Precisamos desmockar o componente pois ele foi mockado globalmente no jest.setup.cjs
jest.unmock('./OnboardingTour');
import OnboardingTour from './OnboardingTour';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { updateCurrentUser } from '../../api/auth';
import { STATUS } from 'react-joyride';

// Mocks
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useTenant');
jest.mock('../../api/auth');

const t = (key, fallback) => fallback;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
  }),
}));

// Mock react-joyride
jest.mock('react-joyride', () => {
  return {
    __esModule: true,
    default: function Joyride({ run, callback, steps }) {
      if (!run) return null;
      return (
        <div data-testid="joyride-mock">
          {steps.map((step) => (
            <div key={step.content}>{step.content}</div>
          ))}
          <button onClick={() => callback({ status: 'finished' })}>
            Finish
          </button>
          <button onClick={() => callback({ status: 'skipped' })}>Skip</button>
        </div>
      );
    },
    STATUS: {
      FINISHED: 'finished',
      SKIPPED: 'skipped',
    },
  };
});
// Also mock STATUS constants if needed, but we import them from the real module for the mock to use strings matching real usage if possible.
// However, since we mock the module default export, named exports might need attention.
// Actually, 'react-joyride' exports STATUS as a named export.
// If I mock the whole module, I lose STATUS.
// Let's use jest.requireActual for STATUS or just hardcode strings since we control the mock.
// 'finished' and 'skipped' are the standard strings.

describe('OnboardingTour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/dashboard');
    window.localStorage.clear();
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    useTenant.mockReturnValue({ slug: 'test-salon' });
  });

  it('does not render if user is not logged in', () => {
    useAuth.mockReturnValue({ user: null, refreshUser: jest.fn() });
    render(<OnboardingTour />);
    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
  });

  it('does not render if tour is already completed', () => {
    useAuth.mockReturnValue({
      user: {
        onboarding_status: { tour_completed: true },
      },
      refreshUser: jest.fn(),
    });
    render(<OnboardingTour />);

    // Wait for effect
    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
  });

  it('renders tour if tour is not completed', async () => {
    useAuth.mockReturnValue({
      user: {
        onboarding_status: { tour_completed: false },
      },
      refreshUser: jest.fn(),
    });

    render(<OnboardingTour />);

    // Initial render is null, wait for timeout
    await waitFor(
      () => {
        expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(
      screen.getByText(
        'Bem-vindo ao TimelyOne! Vamos fazer um tour rápido pela plataforma.'
      )
    ).toBeInTheDocument();
  });

  it('calls updateCurrentUser and refreshUser when tour is finished', async () => {
    const refreshUser = jest.fn();
    useAuth.mockReturnValue({
      user: {
        onboarding_status: { tour_completed: false },
      },
      refreshUser,
    });

    render(<OnboardingTour />);

    await waitFor(
      () => {
        expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const finishButton = screen.getByText('Finish');

    // Mock successful update
    updateCurrentUser.mockResolvedValue({});

    await act(async () => {
      finishButton.click();
    });

    expect(updateCurrentUser).toHaveBeenCalledWith({
      onboarding_status: { tour_completed: true },
    });
    expect(refreshUser).toHaveBeenCalled();
  });

  it('calls updateCurrentUser when tour is skipped', async () => {
    useAuth.mockReturnValue({
      user: {
        onboarding_status: { tour_completed: false },
      },
      refreshUser: jest.fn(),
    });

    render(<OnboardingTour />);

    await waitFor(
      () => {
        expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const skipButton = screen.getByText('Skip');

    // Mock successful update
    updateCurrentUser.mockResolvedValue({});

    await act(async () => {
      skipButton.click();
    });

    expect(updateCurrentUser).toHaveBeenCalledWith({
      onboarding_status: { tour_completed: true },
    });
  });

  it('does not render outside dashboard route', async () => {
    window.history.pushState({}, '', '/bookings');
    useAuth.mockReturnValue({
      user: {
        onboarding_status: { tour_completed: false },
      },
      refreshUser: jest.fn(),
    });

    render(<OnboardingTour />);

    await waitFor(
      () => {
        expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('does not render if onboarding_status is missing in user payload', async () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
      },
      refreshUser: jest.fn(),
    });

    render(<OnboardingTour />);

    await waitFor(
      () => {
        expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
