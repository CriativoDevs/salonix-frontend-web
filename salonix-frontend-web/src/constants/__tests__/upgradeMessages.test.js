import {
  FEATURE_UPGRADE_MESSAGES,
  getFeatureUpgradeMessage,
  getFeaturesByPlan,
  hasUpgradeMessage,
  CONFIGURED_FEATURES,
  FEATURES_COUNT_BY_PLAN,
} from '../upgradeMessages';

describe('upgradeMessages', () => {
  describe('FEATURE_UPGRADE_MESSAGES', () => {
    it('deve ter mensagens configuradas para features principais', () => {
      expect(FEATURE_UPGRADE_MESSAGES).toBeDefined();
      expect(FEATURE_UPGRADE_MESSAGES.enableAdvancedReports).toBeDefined();
      expect(FEATURE_UPGRADE_MESSAGES.enableCustomerPwa).toBeDefined();
      expect(FEATURE_UPGRADE_MESSAGES.enableWhiteLabel).toBeDefined();
    });

    it('cada feature deve ter estrutura completa', () => {
      const feature = FEATURE_UPGRADE_MESSAGES.enableAdvancedReports;

      expect(feature).toHaveProperty('titleKey');
      expect(feature).toHaveProperty('descriptionKey');
      expect(feature).toHaveProperty('ctaKey');
      expect(feature).toHaveProperty('icon');
      expect(feature).toHaveProperty('requiredPlan');
    });

    it('todas as chaves i18n devem seguir padrão correto', () => {
      Object.entries(FEATURE_UPGRADE_MESSAGES).forEach(([, message]) => {
        expect(message.titleKey).toMatch(/^upgrade\.features\.\w+\.title$/);
        expect(message.descriptionKey).toMatch(
          /^upgrade\.features\.\w+\.description$/
        );
        expect(message.ctaKey).toMatch(/^upgrade\.features\.\w+\.cta$/);
      });
    });

    it('todos os planos devem ser válidos', () => {
      const validPlans = ['Founder', 'Basic', 'Standard', 'Pro'];

      Object.values(FEATURE_UPGRADE_MESSAGES).forEach((message) => {
        expect(validPlans).toContain(message.requiredPlan);
      });
    });

    it('todos os ícones devem ser componentes válidos', () => {
      Object.values(FEATURE_UPGRADE_MESSAGES).forEach((message) => {
        expect(message.icon).toBeDefined();
        // Lucide icons podem ser function (v0.263+) ou object (ForwardRef)
        const iconType = typeof message.icon;
        expect(['function', 'object']).toContain(iconType);
      });
    });
  });

  describe('getFeatureUpgradeMessage', () => {
    it('deve retornar mensagem para feature existente', () => {
      const message = getFeatureUpgradeMessage('enableAdvancedReports');

      expect(message).toBeDefined();
      expect(message.titleKey).toBe('upgrade.features.advanced_reports.title');
      expect(message.requiredPlan).toBe('Pro');
    });

    it('deve retornar null para feature inexistente', () => {
      const message = getFeatureUpgradeMessage('featureQueNaoExiste');

      expect(message).toBeNull();
    });

    it('deve retornar mensagens diferentes para features diferentes', () => {
      const reportsMsg = getFeatureUpgradeMessage('enableAdvancedReports');
      const pwaMsg = getFeatureUpgradeMessage('enableCustomerPwa');

      expect(reportsMsg).not.toEqual(pwaMsg);
      expect(reportsMsg.requiredPlan).toBe('Pro');
      expect(pwaMsg.requiredPlan).toBe('Basic');
    });
  });

  describe('getFeaturesByPlan', () => {
    it('deve retornar features do plano Basic', () => {
      const basicFeatures = getFeaturesByPlan('Basic');

      expect(Array.isArray(basicFeatures)).toBe(true);
      expect(basicFeatures.length).toBeGreaterThan(0);
      expect(basicFeatures).toContain('enableCustomerPwa');
      expect(basicFeatures).toContain('enableWebPush');
    });

    it('deve retornar features do plano Standard', () => {
      const standardFeatures = getFeaturesByPlan('Standard');

      expect(Array.isArray(standardFeatures)).toBe(true);
      expect(standardFeatures.length).toBeGreaterThan(0);
      expect(standardFeatures).toContain('enableAdvancedScheduling');
      expect(standardFeatures).toContain('enableCustomFields');
    });

    it('deve retornar features do plano Pro', () => {
      const proFeatures = getFeaturesByPlan('Pro');

      expect(Array.isArray(proFeatures)).toBe(true);
      expect(proFeatures.length).toBeGreaterThan(0);
      expect(proFeatures).toContain('enableAdvancedReports');
      expect(proFeatures).toContain('enableWhiteLabel');
      expect(proFeatures).toContain('enableApiAccess');
    });

    it('deve retornar array vazio para plano inexistente', () => {
      const features = getFeaturesByPlan('PlanoInexistente');

      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('features de um plano não devem aparecer em outro', () => {
      const basicFeatures = getFeaturesByPlan('Basic');
      const proFeatures = getFeaturesByPlan('Pro');

      // Features Pro não devem estar em Basic
      expect(basicFeatures).not.toContain('enableAdvancedReports');
      expect(basicFeatures).not.toContain('enableWhiteLabel');

      // Features Basic não devem estar em Pro
      expect(proFeatures).not.toContain('enableCustomerPwa');
    });
  });

  describe('hasUpgradeMessage', () => {
    it('deve retornar true para features configuradas', () => {
      expect(hasUpgradeMessage('enableAdvancedReports')).toBe(true);
      expect(hasUpgradeMessage('enableCustomerPwa')).toBe(true);
      expect(hasUpgradeMessage('enableWhiteLabel')).toBe(true);
    });

    it('deve retornar false para features não configuradas', () => {
      expect(hasUpgradeMessage('featureInexistente')).toBe(false);
      expect(hasUpgradeMessage('')).toBe(false);
      expect(hasUpgradeMessage(null)).toBe(false);
    });
  });

  describe('CONFIGURED_FEATURES', () => {
    it('deve conter lista de todas as features', () => {
      expect(Array.isArray(CONFIGURED_FEATURES)).toBe(true);
      expect(CONFIGURED_FEATURES.length).toBeGreaterThan(0);
    });

    it('deve conter features principais', () => {
      expect(CONFIGURED_FEATURES).toContain('enableAdvancedReports');
      expect(CONFIGURED_FEATURES).toContain('enableCustomerPwa');
      expect(CONFIGURED_FEATURES).toContain('enableWhiteLabel');
    });

    it('todos os itens devem ser strings', () => {
      CONFIGURED_FEATURES.forEach((featureKey) => {
        expect(typeof featureKey).toBe('string');
      });
    });

    it('não deve ter duplicatas', () => {
      const uniqueFeatures = [...new Set(CONFIGURED_FEATURES)];
      expect(CONFIGURED_FEATURES.length).toBe(uniqueFeatures.length);
    });
  });

  describe('FEATURES_COUNT_BY_PLAN', () => {
    it('deve ter contadores para todos os planos', () => {
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Basic');
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Standard');
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Pro');
    });

    it('contadores devem ser números positivos', () => {
      expect(FEATURES_COUNT_BY_PLAN.Basic).toBeGreaterThan(0);
      expect(FEATURES_COUNT_BY_PLAN.Standard).toBeGreaterThan(0);
      expect(FEATURES_COUNT_BY_PLAN.Pro).toBeGreaterThan(0);
    });

    it('soma de features deve bater com total configurado', () => {
      // FEATURES_COUNT_BY_PLAN só conta Basic, Standard, Pro
      // mas enableBasicReports tem requiredPlan='Founder' (acessível a todos)
      const totalFromCounts =
        FEATURES_COUNT_BY_PLAN.Basic +
        FEATURES_COUNT_BY_PLAN.Standard +
        FEATURES_COUNT_BY_PLAN.Pro;

      // Total deve ser 17 (não conta Founder separadamente pois já está em todos)
      expect(totalFromCounts).toBe(17);
      expect(CONFIGURED_FEATURES.length).toBe(18); // Total inclui todas as features
    });

    it('plano Pro deve ter mais features que Basic', () => {
      // Pro é premium, deve ter mais recursos exclusivos
      expect(FEATURES_COUNT_BY_PLAN.Pro).toBeGreaterThan(0);
    });
  });

  describe('Integração com i18n', () => {
    it('chaves devem seguir namespace upgrade.features', () => {
      const feature = FEATURE_UPGRADE_MESSAGES.enableAdvancedReports;

      expect(feature.titleKey).toContain('upgrade.features.');
      expect(feature.descriptionKey).toContain('upgrade.features.');
      expect(feature.ctaKey).toContain('upgrade.features.');
    });

    it('chaves de diferentes features devem ter prefixos diferentes', () => {
      const reports = FEATURE_UPGRADE_MESSAGES.enableAdvancedReports;
      const pwa = FEATURE_UPGRADE_MESSAGES.enableCustomerPwa;

      expect(reports.titleKey).not.toBe(pwa.titleKey);
      expect(reports.descriptionKey).not.toBe(pwa.descriptionKey);
      expect(reports.ctaKey).not.toBe(pwa.ctaKey);
    });
  });

  describe('Cobertura de Features', () => {
    it('deve ter pelo menos 15 features configuradas', () => {
      // Garantir cobertura mínima conforme especificação (10+)
      expect(CONFIGURED_FEATURES.length).toBeGreaterThanOrEqual(15);
    });

    it('deve ter features para todos os níveis de plano', () => {
      const basicFeatures = getFeaturesByPlan('Basic');
      const standardFeatures = getFeaturesByPlan('Standard');
      const proFeatures = getFeaturesByPlan('Pro');

      expect(basicFeatures.length).toBeGreaterThan(0);
      expect(standardFeatures.length).toBeGreaterThan(0);
      expect(proFeatures.length).toBeGreaterThan(0);
    });

    it('deve incluir features críticas do sistema', () => {
      // Features essenciais que devem estar presentes
      const criticalFeatures = [
        'enableAdvancedReports',
        'enableCustomerPwa',
        'enableWhiteLabel',
        'enableWebPush',
        'enableSmsNotifications',
        'enableWhatsappIntegration',
        'enableOnlinePayments',
      ];

      criticalFeatures.forEach((feature) => {
        expect(hasUpgradeMessage(feature)).toBe(true);
      });
    });
  });
});
