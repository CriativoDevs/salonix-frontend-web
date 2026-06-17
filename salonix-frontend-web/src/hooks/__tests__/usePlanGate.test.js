/* eslint-env jest */

import { renderHook } from '@testing-library/react';
import usePlanGate from '../usePlanGate';

jest.mock('../useTenant', () => ({
  useTenant: () => ({ plan: { tier: 'basic', name: 'Basic' } }),
}));

describe('usePlanGate', () => {
  it('permite quando não há tier requerido', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.allowed).toBe(true);
  });

  it('permite acesso a features ex-Pro no plano único', () => {
    // FEW-PLANS-01 (#320): tiers nivelados — Basic já não é "inferior" a Pro.
    const { result } = renderHook(() => usePlanGate({ requiredTier: 'pro' }));
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiredTier).toBe('pro');
    expect(result.current.currentTier).toBe('basic');
  });

  // featureKey path exercitado indiretamente no componente; aqui cobrimos requiredTier
});
