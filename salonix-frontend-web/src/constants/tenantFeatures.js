export const TENANT_FEATURE_REQUIREMENTS = {
  enableCustomerPwa: {
    label: 'PWA Cliente',
    requiredPlan: 'Standard',
    description:
      'Disponível a partir do plano Standard. Permite que clientes reservem diretamente pelo PWA personalizado.',
  },
  enableWebPush: {
    label: 'Notificações Web Push',
    requiredPlan: 'Standard',
    description:
      'Disponível a partir do plano Standard. Ative alertas de lembrete e marketing via navegador.',
  },
  enableReports: {
    label: 'Relatórios avançados',
    requiredPlan: 'Pro',
    description: 'Disponível a partir do plano Pro. Desbloqueia métricas detalhadas e exportação avançada.',
  },
};

export function describeFeatureRequirement(featureKey, currentPlanName) {
  const requirement = TENANT_FEATURE_REQUIREMENTS[featureKey];
  if (!requirement) {
    return {
      label: featureKey,
      requiredPlan: null,
      description: `Funcionalidade disponível em planos superiores. Plano atual: ${currentPlanName || 'desconhecido'}.`,
    };
  }

  return {
    ...requirement,
    description: `${requirement.description} Plano atual: ${currentPlanName || 'desconhecido'}.`,
  };
}
