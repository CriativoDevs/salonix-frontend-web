import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useFeatureLock from '../useFeatureLock';
import usePlanGate from '../usePlanGate';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../usePlanGate');

const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('useFeatureLock', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  it('returns isLocked true when not allowed', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: 'Basic',
      requiredTier: 'Pro',
      loading: false,
    });

    const { result } = renderHook(() => useFeatureLock('enableReports'), {
      wrapper,
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.isAllowed).toBe(false);
  });

  it('returns isLocked false when allowed', () => {
    usePlanGate.mockReturnValue({
      allowed: true,
      currentTier: 'Pro',
      requiredTier: 'Pro',
      loading: false,
    });

    const { result } = renderHook(() => useFeatureLock('enableReports'), {
      wrapper,
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.isAllowed).toBe(true);
  });

  it('returns current and required tiers', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: 'Standard',
      requiredTier: 'Pro',
      loading: false,
    });

    const { result } = renderHook(() => useFeatureLock('enableReports'), {
      wrapper,
    });

    expect(result.current.currentTier).toBe('Standard');
    expect(result.current.requiredTier).toBe('Pro');
  });

  it('returns loading state', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: null,
      requiredTier: null,
      loading: true,
    });

    const { result } = renderHook(() => useFeatureLock('enableReports'), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
  });

  it('showUpgrade navigates to plans page with state', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: 'Basic',
      requiredTier: 'Pro',
      loading: false,
    });

    const { result } = renderHook(() => useFeatureLock('enableReports'), {
      wrapper,
    });

    result.current.showUpgrade();

    expect(mockNavigate).toHaveBeenCalledWith('/plans', {
      state: {
        highlightPlan: 'Pro',
        fromFeature: 'enableReports',
      },
    });
  });

  it('showUpgrade uses requiredTier from featureKey if not provided', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: 'Basic',
      requiredTier: null,
      loading: false,
    });

    const { result } = renderHook(
      () => useFeatureLock('enableAdvancedReports'),
      {
        wrapper,
      }
    );

    result.current.showUpgrade();

    expect(mockNavigate).toHaveBeenCalledWith('/plans', {
      state: {
        highlightPlan: 'Pro', // Vem de TENANT_FEATURE_REQUIREMENTS
        fromFeature: 'enableAdvancedReports',
      },
    });
  });

  it('works without featureKey', () => {
    usePlanGate.mockReturnValue({
      allowed: false,
      currentTier: 'Basic',
      requiredTier: 'Pro',
      loading: false,
    });

    const { result } = renderHook(() => useFeatureLock(null, 'Pro'), {
      wrapper,
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.requiredTier).toBe('Pro');
  });
});
