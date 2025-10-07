import { DEFAULT_TENANT_META, PLAN_NAME_BY_TIER } from './tenant';

export const PLAN_TIER_PRIORITY = {
  starter: 0,
  basic: 1,
  standard: 2,
  pro: 3,
  enterprise: 4,
};

export function resolvePlanTier(plan, fallbackTier = DEFAULT_TENANT_META.plan.tier) {
  if (plan && typeof plan === 'object') {
    return plan.tier || plan.code || fallbackTier;
  }
  return fallbackTier;
}

export function resolvePlanName(plan, fallbackName = DEFAULT_TENANT_META.plan.name) {
  const tier = resolvePlanTier(plan);
  if (plan && typeof plan === 'object') {
    if (plan.name && typeof plan.name === 'string') {
      return plan.name;
    }
  }

  if (tier && PLAN_NAME_BY_TIER[tier]) {
    return PLAN_NAME_BY_TIER[tier];
  }

  if (tier && typeof tier === 'string') {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  return fallbackName;
}

export function resolvePlanModules(
  plan,
  modules,
  fallbackModules = DEFAULT_TENANT_META.modules
) {
  if (Array.isArray(modules) && modules.length > 0) {
    return [...new Set(modules)];
  }

  const planFeatures = plan && Array.isArray(plan.features) ? plan.features : [];
  const planAddons = plan && Array.isArray(plan.addons) ? plan.addons : [];
  const combined = [...planFeatures, ...planAddons];

  if (combined.length > 0) {
    return [...new Set(combined)];
  }

  if (Array.isArray(fallbackModules)) {
    return [...new Set(fallbackModules)];
  }

  return []; 
}

export function comparePlanTiers(requiredTier, currentTier) {
  if (!requiredTier) {
    return 0;
  }

  const normalizedRequired = String(requiredTier).toLowerCase();
  const normalizedCurrent = String(currentTier || '').toLowerCase();

  const requiredPriority = PLAN_TIER_PRIORITY[normalizedRequired] ?? -1;
  const currentPriority = PLAN_TIER_PRIORITY[normalizedCurrent] ?? -1;

  if (requiredPriority === currentPriority) {
    return 0;
  }

  if (currentPriority > requiredPriority) {
    return 1;
  }

  if (currentPriority < requiredPriority) {
    return -1;
  }

  return -1;
}
