import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { RateLimitProvider } from '../../contexts/RateLimitContext';
import { RATE_LIMIT_EVENT } from '../../constants/events';
import RateLimitWarning from '../../components/ui/RateLimitWarning';

// Mock Translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'rate_limit_warning') return `Wait ${options.seconds}s...`;
      return key;
    },
  }),
}));

describe('Rate Limit Handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows warning when rate limit event is fired', async () => {
    render(
      <RateLimitProvider>
        <RateLimitWarning />
      </RateLimitProvider>
    );

    // Should not be visible initially
    expect(screen.queryByText(/Wait/)).not.toBeInTheDocument();

    // Trigger event
    act(() => {
      window.dispatchEvent(
        new CustomEvent(RATE_LIMIT_EVENT, { detail: { retryAfter: 30 } })
      );
    });

    // Should be visible now
    expect(screen.getByText('Wait 30s...')).toBeInTheDocument();

    // Advance time by 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should update countdown (implementation depends on how often it updates,
    // my context updates every second)
    expect(screen.getByText('Wait 20s...')).toBeInTheDocument();

    // Fast forward to end
    act(() => {
      jest.advanceTimersByTime(21000);
    });

    // Should disappear
    expect(screen.queryByText(/Wait/)).not.toBeInTheDocument();
  });
});
