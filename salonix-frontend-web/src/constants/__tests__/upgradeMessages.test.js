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
      // FEW-PLANS-01 (#320): plano único — features ex-Pro agora gateadas no Founder.
      expect(message.requiredPlan).toBe('Founder');
    });

    it('deve retornar null para feature inexistente', () => {
      const message = getFeatureUpgradeMessage('featureQueNaoExiste');

      expect(message).toBeNull();
    });

    it('deve retornar mensagens diferentes para features diferentes', () => {
      const reportsMsg = getFeatureUpgradeMessage('enableAdvancedReports');
      const pwaMsg = getFeatureUpgradeMessage('enableCustomerPwa');

      expect(reportsMsg).not.toEqual(pwaMsg);
      // FEW-PLANS-01 (#320): plano único — todas as features gateadas no Founder.
      expect(reportsMsg.requiredPlan).toBe('Founder');
      expect(pwaMsg.requiredPlan).toBe('Founder');
    });
  });

  describe('getFeaturesByPlan', () => {
    it('deve retornar features do plano Basic', () => {
      const basicFeatures = getFeaturesByPlan('Basic');

      expect(Array.isArray(basicFeatures)).toBe(true);
      expect(basicFeatures.length).toBe(0);
    });

    it('deve retornar features do plano Standard', () => {
      const standardFeatures = getFeaturesByPlan('Standard');

      expect(Array.isArray(standardFeatures)).toBe(true);
      expect(standardFeatures.length).toBe(0);
    });

    it('deve retornar features do plano Founder (plano único)', () => {
      // FEW-PLANS-01 (#320): com plano único, as features ex-Pro estão no Founder.
      const founderFeatures = getFeaturesByPlan('Founder');

      expect(Array.isArray(founderFeatures)).toBe(true);
      expect(founderFeatures.length).toBeGreaterThan(0);
      expect(founderFeatures).toContain('enableAdvancedReports');
      expect(founderFeatures).toContain('enableWhiteLabel');
      expect(founderFeatures).toContain('enableApiAccess');
    });

    it('plano Pro deixou de ter features exclusivas', () => {
      // FEW-PLANS-01 (#320): Pro descontinuado — bucket vazio.
      expect(getFeaturesByPlan('Pro')).toEqual([]);
    });

    it('deve retornar array vazio para plano inexistente', () => {
      const features = getFeaturesByPlan('PlanoInexistente');

      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('features concentram-se no plano único (Founder)', () => {
      // FEW-PLANS-01 (#320): sem segmentação por tier — Basic/Standard/Pro vazios.
      const founderFeatures = getFeaturesByPlan('Founder');

      expect(founderFeatures).toContain('enableAdvancedReports');
      expect(founderFeatures).toContain('enableWhiteLabel');
      expect(founderFeatures).toContain('enableCustomerPwa');
      expect(getFeaturesByPlan('Basic')).toEqual([]);
      expect(getFeaturesByPlan('Standard')).toEqual([]);
      expect(getFeaturesByPlan('Pro')).toEqual([]);
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
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Founder');
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Basic');
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Standard');
      expect(FEATURES_COUNT_BY_PLAN).toHaveProperty('Pro');
    });

    it('contadores devem ser números válidos', () => {
      // FEW-PLANS-01 (#320): plano único — features concentradas no Founder.
      expect(FEATURES_COUNT_BY_PLAN.Founder).toBeGreaterThan(0);
      expect(FEATURES_COUNT_BY_PLAN.Basic).toBeGreaterThanOrEqual(0);
      expect(FEATURES_COUNT_BY_PLAN.Standard).toBeGreaterThanOrEqual(0);
      expect(FEATURES_COUNT_BY_PLAN.Pro).toBe(0);
    });

    it('todas as features configuradas estão no plano único (Founder)', () => {
      expect(FEATURES_COUNT_BY_PLAN.Founder).toBe(CONFIGURED_FEATURES.length);
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

    it('concentra as features no plano único (Founder)', () => {
      // FEW-PLANS-01 (#320): Founder é o plano único; demais buckets vazios.
      expect(getFeaturesByPlan('Founder').length).toBeGreaterThan(0);
      expect(getFeaturesByPlan('Basic')).toEqual([]);
      expect(getFeaturesByPlan('Standard')).toEqual([]);
      expect(getFeaturesByPlan('Pro')).toEqual([]);
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
