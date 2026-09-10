/* eslint-env jest */

import { renderHook } from '@testing-library/react';
import usePlanGate from '../usePlanGate';

let mockUseTenant = () => ({ plan: { tier: 'basic', name: 'Basic' } });
jest.mock('../useTenant', () => ({
  useTenant: (...args) => mockUseTenant(...args),
}));

describe('usePlanGate', () => {
  beforeEach(() => {
    mockUseTenant = () => ({ plan: { tier: 'basic', name: 'Basic' } });
  });

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

  describe('enableCustomerPwa (regressão BUG-PWA-ENTITLEMENT)', () => {
    it('permite acesso quando o plano tem entitlement, mesmo com o toggle desligado', () => {
      // Cenário real: tenant Basic/Founder com "PWA Cliente" desligado nas
      // configurações. O card de configuração deve continuar acessível —
      // só o entitlement de plano (can_use_pwa_client) deve bloquear.
      mockUseTenant = () => ({
        plan: { tier: 'basic', name: 'Basic' },
        featureFlagsRaw: {
          modules: {
            pwa_client_enabled: false, // toggle bruto desligado pelo tenant
            can_use_pwa_client: true, // entitlement do plano
          },
        },
      });
      const { result } = renderHook(() =>
        usePlanGate({ featureKey: 'enableCustomerPwa' })
      );
      expect(result.current.allowed).toBe(true);
    });

    it('bloqueia quando o plano não tem entitlement, mesmo com o toggle ligado', () => {
      mockUseTenant = () => ({
        plan: { tier: 'founder', name: 'Founder' },
        featureFlagsRaw: {
          modules: {
            pwa_client_enabled: true,
            can_use_pwa_client: false,
          },
        },
      });
      const { result } = renderHook(() =>
        usePlanGate({ featureKey: 'enableCustomerPwa' })
      );
      expect(result.current.allowed).toBe(false);
    });
  });
});
