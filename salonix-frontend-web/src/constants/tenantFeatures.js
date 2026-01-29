/**
 * Mapeamento de features para planos requeridos
 * Sincronizado com upgradeMessages.js
 *
 * Cada feature contém:
 * - labelKey: Chave i18n para o label
 * - requiredPlan: Plano mínimo ('Founder', 'Basic', 'Standard', 'Pro')
 * - descriptionKey: Chave i18n para a descrição
 * - comingSoon: (opcional) Se true, feature está no roadmap
 */
export const TENANT_FEATURE_REQUIREMENTS = {
  // ==========================================
  // RELATÓRIOS (3 níveis)
  // ==========================================

  // Visão Geral - Todos os planos
  enableBasicReports: {
    labelKey: 'settings.features.reports_basic.label',
    requiredPlan: 'Founder', // Todos os planos
    descriptionKey: 'settings.features.reports_basic.description',
  },

  // Análise do Negócio - Standard+
  enableBusinessReports: {
    labelKey: 'settings.features.reports_business.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.reports_business.description',
  },

  // Insights Avançados - Pro
  enableAdvancedReports: {
    labelKey: 'settings.features.reports_advanced.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.reports_advanced.description',
  },

  // ==========================================
  // APLICATIVOS E PWA
  // ==========================================

  // PWA para Clientes - Basic+
  enableCustomerPwa: {
    labelKey: 'settings.features.pwa.label',
    requiredPlan: 'Basic',
    descriptionKey: 'settings.features.pwa.description',
  },

  // App Nativo para Clientes - Pro (ROADMAP)
  enableNativeClientApp: {
    labelKey: 'settings.features.native_client.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.native_client.description',
    comingSoon: true,
  },

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================

  // Push Web - Basic+
  enableWebPush: {
    labelKey: 'settings.features.webpush.label',
    requiredPlan: 'Basic',
    descriptionKey: 'settings.features.webpush.description',
  },

  // SMS - Standard+
  enableSmsNotifications: {
    labelKey: 'settings.features.sms_notifications.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.sms_notifications.description',
  },

  // WhatsApp - Pro
  enableWhatsappIntegration: {
    labelKey: 'settings.features.whatsapp_integration.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.whatsapp_integration.description',
  },

  // ==========================================
  // PERSONALIZAÇÃO E MARCA
  // ==========================================

  // White Label - Pro (ROADMAP)
  enableWhiteLabel: {
    labelKey: 'settings.features.white_label.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.white_label.description',
    comingSoon: true,
  },

  // ==========================================
  // AGENDAMENTO E GESTÃO
  // ==========================================

  // Agendamento Avançado - Standard+ (ROADMAP)
  enableAdvancedScheduling: {
    labelKey: 'settings.features.advanced_scheduling.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.advanced_scheduling.description',
    comingSoon: true,
  },

  // Gestão de Equipe - Standard+ (ROADMAP)
  enableTeamManagement: {
    labelKey: 'settings.features.team_management.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.team_management.description',
    comingSoon: true,
  },

  // Campos Personalizados - Standard+ (ROADMAP)
  enableCustomFields: {
    labelKey: 'settings.features.custom_fields.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.custom_fields.description',
    comingSoon: true,
  },

  // ==========================================
  // RECURSOS AVANÇADOS
  // ==========================================

  // Multi-localização - Pro (ROADMAP)
  enableMultiLocation: {
    labelKey: 'settings.features.multi_location.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.multi_location.description',
    comingSoon: true,
  },

  // Acesso à API - Pro (ROADMAP)
  enableApiAccess: {
    labelKey: 'settings.features.api_access.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.api_access.description',
    comingSoon: true,
  },

  // Automações - Standard+ (ROADMAP)
  enableAutomations: {
    labelKey: 'settings.features.automations.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.automations.description',
    comingSoon: true,
  },

  // ==========================================
  // PAGAMENTOS E SUPORTE
  // ==========================================

  // Pagamentos Online - Standard+ (ROADMAP)
  enableOnlinePayments: {
    labelKey: 'settings.features.online_payments.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.online_payments.description',
    comingSoon: true,
  },

  // Exportação de Dados - Standard+ (ROADMAP Parcial)
  enableDataExport: {
    labelKey: 'settings.features.data_export.label',
    requiredPlan: 'Standard',
    descriptionKey: 'settings.features.data_export.description',
    comingSoon: true,
  },

  // Suporte Prioritário - Pro (ROADMAP)
  enablePrioritySupport: {
    labelKey: 'settings.features.priority_support.label',
    requiredPlan: 'Pro',
    descriptionKey: 'settings.features.priority_support.description',
    comingSoon: true,
  },
};

/**
 * Retorna informações sobre uma feature e seu plano requerido
 *
 * @param {string} featureKey - Chave da feature
 * @param {string} currentPlanName - Plano atual do usuário
 * @returns {object} Objeto com dados da feature
 */
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

/**
 * Retorna todas as features agrupadas por plano
 *
 * @returns {object} Objeto com arrays de features por plano
 * @example
 * {
 *   Founder: ['enableBasicReports'],
 *   Basic: ['enableCustomerPwa', 'enableWebPush'],
 *   Standard: ['enableBusinessReports', 'enableSmsNotifications', ...],
 *   Pro: ['enableAdvancedReports', 'enableWhatsappIntegration', ...]
 * }
 */
export function getFeaturesByPlan() {
  const byPlan = {
    Founder: [],
    Basic: [],
    Standard: [],
    Pro: [],
  };

  Object.entries(TENANT_FEATURE_REQUIREMENTS).forEach(([key, config]) => {
    const plan = config.requiredPlan;
    if (byPlan[plan]) {
      byPlan[plan].push(key);
    }
  });

  return byPlan;
}

/**
 * Retorna features implementadas (sem comingSoon)
 *
 * @returns {Array<string>} Array de chaves de features implementadas
 */
export function getImplementedFeatures() {
  return Object.entries(TENANT_FEATURE_REQUIREMENTS)
    .filter(([, config]) => !config.comingSoon)
    .map(([key]) => key);
}

/**
 * Retorna features no roadmap (com comingSoon)
 *
 * @returns {Array<string>} Array de chaves de features no roadmap
 */
export function getRoadmapFeatures() {
  return Object.entries(TENANT_FEATURE_REQUIREMENTS)
    .filter(([, config]) => config.comingSoon)
    .map(([key]) => key);
}

/**
 * Verifica se uma feature existe no mapeamento
 *
 * @param {string} featureKey - Chave da feature
 * @returns {boolean} true se existe
 */
export function hasFeature(featureKey) {
  return featureKey in TENANT_FEATURE_REQUIREMENTS;
}

/**
 * Retorna contagem de features por plano
 *
 * @returns {object} Contadores por plano
 */
export function getFeatureCountByPlan() {
  const byPlan = getFeaturesByPlan();
  return {
    Founder: byPlan.Founder.length,
    Basic: byPlan.Basic.length,
    Standard: byPlan.Standard.length,
    Pro: byPlan.Pro.length,
    total: Object.keys(TENANT_FEATURE_REQUIREMENTS).length,
    implemented: getImplementedFeatures().length,
    roadmap: getRoadmapFeatures().length,
  };
}
