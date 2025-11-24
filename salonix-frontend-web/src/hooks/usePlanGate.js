import { useMemo } from 'react';
import { useTenant } from './useTenant';
import { resolvePlanTier, comparePlanTiers } from '../utils/tenantPlan';
import { TENANT_FEATURE_REQUIREMENTS } from '../constants/tenantFeatures';

export default function usePlanGate(options = {}) {
  const { featureKey, requiredTier } = options;
  const { plan } = useTenant();

  const currentTier = useMemo(() => {
    return resolvePlanTier(plan);
  }, [plan]);

  const required = useMemo(() => {
    if (requiredTier) return String(requiredTier).toLowerCase();
    if (featureKey && TENANT_FEATURE_REQUIREMENTS[featureKey]?.requiredPlan) {
      return String(TENANT_FEATURE_REQUIREMENTS[featureKey].requiredPlan).toLowerCase();
    }
    return null;
  }, [featureKey, requiredTier]);

  const allowed = useMemo(() => {
    if (!required) return true;
    const cmp = comparePlanTiers(required, currentTier);
    return cmp >= 0;
  }, [required, currentTier]);

  return { allowed, currentTier, requiredTier: required };
}

