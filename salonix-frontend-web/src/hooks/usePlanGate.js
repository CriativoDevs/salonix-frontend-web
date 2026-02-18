import { useMemo } from 'react';
import { useTenant } from './useTenant';
import { resolvePlanTier, comparePlanTiers } from '../utils/tenantPlan';
import { TENANT_FEATURE_REQUIREMENTS } from '../constants/tenantFeatures';

export default function usePlanGate(options = {}) {
  const { featureKey, requiredTier } = options;
  const { plan, flags, featureFlagsRaw, loading } = useTenant();

  const currentTier = useMemo(() => {
    return resolvePlanTier(plan);
  }, [plan]);

  const explicitFlagEnabled = useMemo(() => {
    if (!featureKey) return undefined;

    // 1. Tentar ler do objeto simplificado 'flags'
    const local =
      flags && typeof flags === 'object' ? flags[featureKey] : undefined;
    if (typeof local === 'boolean') return local;

    // 2. Tentar ler do objeto raw aninhado (modules, notifications, etc.)
    // Lógica espelhada do FeatureGate.jsx
    const raw = featureFlagsRaw || {};
    if (featureKey === 'enableReports') {
      const modules = raw.modules || {};
      if (Object.prototype.hasOwnProperty.call(modules, 'reports_enabled')) {
        return Boolean(modules.reports_enabled);
      }
    }
    if (featureKey === 'enableAdminPwa') {
      const modules = raw.modules || {};
      if (Object.prototype.hasOwnProperty.call(modules, 'pwa_admin_enabled')) {
        return Boolean(modules.pwa_admin_enabled);
      }
    }
    if (featureKey === 'enableCustomerPwa') {
      const modules = raw.modules || {};
      if (Object.prototype.hasOwnProperty.call(modules, 'pwa_client_enabled')) {
        return Boolean(modules.pwa_client_enabled);
      }
    }

    return undefined; // Não encontrou flag explícita
  }, [featureKey, flags, featureFlagsRaw]);

  const required = useMemo(() => {
    if (requiredTier) return String(requiredTier).toLowerCase();
    if (featureKey && TENANT_FEATURE_REQUIREMENTS[featureKey]?.requiredPlan) {
      return String(
        TENANT_FEATURE_REQUIREMENTS[featureKey].requiredPlan
      ).toLowerCase();
    }
    return null;
  }, [featureKey, requiredTier]);

  const allowed = useMemo(() => {
    // Se existe uma flag explícita (True ou False), ela tem precedência absoluta
    if (typeof explicitFlagEnabled === 'boolean') {
      return explicitFlagEnabled;
    }

    // Se não há flag explícita, fallback para verificação de plano
    if (!required) return true;
    const cmp = comparePlanTiers(required, currentTier);
    return cmp >= 0;
  }, [required, currentTier, explicitFlagEnabled]);

  return { allowed, currentTier, requiredTier: required, loading };
}
