import {
  BarChart3,
  Smartphone,
  Palette,
  Globe,
  Calendar,
  MapPin,
  Code,
  ListCheck,
  Headphones,
  TrendingUp,
  Bell,
  Zap,
  Users,
  CreditCard,
  FileText,
} from 'lucide-react';

/**
 * Mensagens de upgrade contextuais por feature
 *
 * Cada entrada contém:
 * - titleKey: Chave i18n para o título
 * - descriptionKey: Chave i18n para a descrição
 * - ctaKey: Chave i18n para o botão de CTA
 * - icon: Componente de ícone Lucide React
 * - requiredPlan: Plano mínimo necessário ('Founder', 'Basic', 'Standard', 'Pro')
 * - comingSoon: (opcional) true se feature não está implementada ainda
 *
 * ⚠️ ATENÇÃO: Features marcadas com comingSoon=true não estão implementadas.
 * Exibir apenas com disclaimer "Em breve" ou similar.
 *
 * Uso:
 * ```jsx
 * import { FEATURE_UPGRADE_MESSAGES } from '@/constants/upgradeMessages';
 *
 * const message = FEATURE_UPGRADE_MESSAGES['enableBasicReports'];
 * if (message.comingSoon) {
 *   // Exibir badge "Em breve"
 * }
 * const Icon = message.icon;
 * <Icon className="h-5 w-5" />
 * ```
 */
export const FEATURE_UPGRADE_MESSAGES = {
  // ==========================================
  // RELATÓRIOS (3 níveis conforme Decision Brief)
  // ==========================================

  // Visão Geral - Todos os planos (Founder, Basic, Pro)
  enableBasicReports: {
    titleKey: 'upgrade.features.reports.title',
    descriptionKey: 'upgrade.features.reports.description',
    ctaKey: 'upgrade.features.reports.cta',
    icon: BarChart3,
    requiredPlan: 'Founder', // Todos têm acesso
  },

  // Análise do Negócio - Apenas Pro
  enableBusinessReports: {
    titleKey: 'upgrade.features.reports.title',
    descriptionKey: 'upgrade.features.reports.description',
    ctaKey: 'upgrade.features.reports.cta',
    icon: TrendingUp,
    requiredPlan: 'Pro',
  },

  // Insights Avançados - Apenas Pro
  enableAdvancedReports: {
    titleKey: 'upgrade.features.advanced_reports.title',
    descriptionKey: 'upgrade.features.advanced_reports.description',
    ctaKey: 'upgrade.features.advanced_reports.cta',
    icon: TrendingUp,
    requiredPlan: 'Pro',
  },

  // PWA para Clientes - Todos os planos
  enableCustomerPwa: {
    titleKey: 'upgrade.features.customer_pwa.title',
    descriptionKey: 'upgrade.features.customer_pwa.description',
    ctaKey: 'upgrade.features.customer_pwa.cta',
    icon: Smartphone,
    requiredPlan: 'Founder',
  },

  // ==========================================
  // FEATURES EM ROADMAP (Não Implementadas)
  // ==========================================

  // White Label (Marca Branca) - ROADMAP
  enableWhiteLabel: {
    titleKey: 'upgrade.features.white_label.title',
    descriptionKey: 'upgrade.features.white_label.description',
    ctaKey: 'upgrade.features.white_label.cta',
    icon: Palette,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Roadmap P3
  },

  // App Nativo para Clientes - ROADMAP
  enableNativeClientApp: {
    titleKey: 'upgrade.features.native_client.title',
    descriptionKey: 'upgrade.features.native_client.description',
    ctaKey: 'upgrade.features.native_client.cta',
    icon: Smartphone,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Parcialmente implementado - Roadmap P2
  },

  // Agendamento Avançado - ROADMAP
  enableAdvancedScheduling: {
    titleKey: 'upgrade.features.advanced_scheduling.title',
    descriptionKey: 'upgrade.features.advanced_scheduling.description',
    ctaKey: 'upgrade.features.advanced_scheduling.cta',
    icon: Calendar,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Refere-se a recorrência e listas de espera
  },

  // Multi-localização - ROADMAP
  enableMultiLocation: {
    titleKey: 'upgrade.features.multi_location.title',
    descriptionKey: 'upgrade.features.multi_location.description',
    ctaKey: 'upgrade.features.multi_location.cta',
    icon: MapPin,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Roadmap P3 (Muito complexo)
  },

  // Acesso à API - ROADMAP
  enableApiAccess: {
    titleKey: 'upgrade.features.api_access.title',
    descriptionKey: 'upgrade.features.api_access.description',
    ctaKey: 'upgrade.features.api_access.cta',
    icon: Code,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Roadmap P2
  },

  // Campos Personalizados - ROADMAP
  enableCustomFields: {
    titleKey: 'upgrade.features.custom_fields.title',
    descriptionKey: 'upgrade.features.custom_fields.description',
    ctaKey: 'upgrade.features.custom_fields.cta',
    icon: ListCheck,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Roadmap P2
  },

  // Suporte Prioritário - ROADMAP
  enablePrioritySupport: {
    titleKey: 'upgrade.features.priority_support.title',
    descriptionKey: 'upgrade.features.priority_support.description',
    ctaKey: 'upgrade.features.priority_support.cta',
    icon: Headphones,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Processo, não tech
  },

  // Notificações Push Web - Todos os planos
  enableWebPush: {
    titleKey: 'upgrade.features.web_push.title',
    descriptionKey: 'upgrade.features.web_push.description',
    ctaKey: 'upgrade.features.web_push.cta',
    icon: Bell,
    requiredPlan: 'Founder',
  },

  // Automações - ROADMAP
  enableAutomations: {
    titleKey: 'upgrade.features.automations.title',
    descriptionKey: 'upgrade.features.automations.description',
    ctaKey: 'upgrade.features.automations.cta',
    icon: Zap,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Roadmap P2 (Alta complexidade)
  },

  // Gestão de Equipe Avançada - Todos os planos
  enableTeamManagement: {
    titleKey: 'upgrade.features.team_management.title',
    descriptionKey: 'upgrade.features.team_management.description',
    ctaKey: 'upgrade.features.team_management.cta',
    icon: Users,
    requiredPlan: 'Founder',
    comingSoon: true, // ⚠️ Parcialmente implementado - Falta relatórios por staff
  },

  // Pagamentos Online - ROADMAP
  enableOnlinePayments: {
    titleKey: 'upgrade.features.online_payments.title',
    descriptionKey: 'upgrade.features.online_payments.description',
    ctaKey: 'upgrade.features.online_payments.cta',
    icon: CreditCard,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Não implementado - Existe billing, mas não checkout integrado
  },

  // Notificações SMS - Todos os planos
  enableSmsNotifications: {
    titleKey: 'upgrade.features.sms_notifications.title',
    descriptionKey: 'upgrade.features.sms_notifications.description',
    ctaKey: 'upgrade.features.sms_notifications.cta',
    icon: Bell,
    requiredPlan: 'Founder',
  },

  // Integração WhatsApp - Todos os planos
  enableWhatsappIntegration: {
    titleKey: 'upgrade.features.whatsapp_integration.title',
    descriptionKey: 'upgrade.features.whatsapp_integration.description',
    ctaKey: 'upgrade.features.whatsapp_integration.cta',
    icon: Bell,
    requiredPlan: 'Founder',
  },

  // Exportação de Dados - ROADMAP (Parcial)
  enableDataExport: {
    titleKey: 'upgrade.features.data_export.title',
    descriptionKey: 'upgrade.features.data_export.description',
    ctaKey: 'upgrade.features.data_export.cta',
    icon: FileText,
    requiredPlan: 'Pro',
    comingSoon: true, // ⚠️ Parcialmente implementado - Existe CSV, falta Excel/JSON
  },
};

/**
 * Retorna a mensagem de upgrade para uma feature específica
 *
 * @param {string} featureKey - Chave da feature (ex: 'enableReports')
 * @returns {object|null} Objeto com dados da mensagem ou null se não encontrado
 *
 * @example
 * const message = getFeatureUpgradeMessage('enableReports');
 * if (message) {
 *   console.log(message.titleKey); // 'upgrade.features.reports.title'
 *   const Icon = message.icon;
 * }
 */
export function getFeatureUpgradeMessage(featureKey) {
  return FEATURE_UPGRADE_MESSAGES[featureKey] || null;
}

/**
 * Retorna todas as features que requerem um plano específico
 *
 * @param {string} planName - Nome do plano ('Basic', 'Standard', 'Pro')
 * @returns {Array<string>} Array com as chaves das features
 *
 * @example
 * const proFeatures = getFeaturesByPlan('Pro');
 * // ['enableReports', 'enableWhiteLabel', ...]
 */
export function getFeaturesByPlan(planName) {
  return Object.entries(FEATURE_UPGRADE_MESSAGES)
    .filter(([, message]) => message.requiredPlan === planName)
    .map(([featureKey]) => featureKey);
}

/**
 * Verifica se uma feature tem mensagem de upgrade configurada
 *
 * @param {string} featureKey - Chave da feature
 * @returns {boolean} True se a feature tem mensagem configurada
 *
 * @example
 * if (hasUpgradeMessage('enableReports')) {
 *   // Mostrar componente UpgradePrompt
 * }
 */
export function hasUpgradeMessage(featureKey) {
  return featureKey in FEATURE_UPGRADE_MESSAGES;
}

/**
 * Lista de todas as chaves de features com mensagens configuradas
 * Útil para validação e debug
 */
export const CONFIGURED_FEATURES = Object.keys(FEATURE_UPGRADE_MESSAGES);

/**
 * Contadores por plano (útil para páginas de pricing)
 */
export const FEATURES_COUNT_BY_PLAN = {
  Basic: getFeaturesByPlan('Basic').length,
  Standard: getFeaturesByPlan('Standard').length,
  Pro: getFeaturesByPlan('Pro').length,
};
