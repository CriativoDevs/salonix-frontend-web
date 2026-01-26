export const TENANT_FEATURE_REQUIREMENTS = {
  enableCustomerPwa: {
    labelKey: 'settings.features.pwa.label',
    requiredPlan: 'Basic',
    descriptionKey: 'settings.features.pwa.description',
  },
  enableWebPush: {
    labelKey: 'settings.features.webpush.label',
    requiredPlan: 'Basic',
    descriptionKey: 'settings.features.webpush.description',
  },
  enableReports: {
    labelKey: 'settings.features.reports.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.reports.description',
  },
};

export function describeFeatureRequirement(featureKey, currentPlanName) {
  const requirement = TENANT_FEATURE_REQUIREMENTS[featureKey];
  if (!requirement) {
    return {
      labelKey: `settings.features.${featureKey}.label`,
      requiredPlan: null,
      descriptionKey: 'settings.features.generic.description',
      currentPlanName,
      isUnknown: true,
    };
  }

  return {
    ...requirement,
    currentPlanName,
  };
}
