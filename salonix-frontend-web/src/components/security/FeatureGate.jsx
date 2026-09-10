import { useMemo } from 'react';
import { useTenant } from '../../hooks/useTenant';

export default function FeatureGate({ featureKey, children, fallback = null }) {
  const { flags, featureFlagsRaw } = useTenant();

  const enabled = useMemo(() => {
    if (!featureKey) return true;
    const raw = featureFlagsRaw || {};
    const modules = raw.modules || {};

    // enableCustomerPwa: `flags.enableCustomerPwa` (objeto simplificado)
    // carrega o TOGGLE bruto (`pwa_client_enabled`), usado noutros pontos
    // para saber se o módulo está LIGADO. O gate de PLANO precisa do
    // entitlement (`can_use_pwa_client`), semanticamente diferente — por
    // isso é checado antes do objeto simplificado. Ver BE-BUG-01 (#537).
    if (
      featureKey === 'enableCustomerPwa' &&
      Object.prototype.hasOwnProperty.call(modules, 'can_use_pwa_client')
    ) {
      return Boolean(modules.can_use_pwa_client);
    }

    const local =
      flags && typeof flags === 'object' ? flags[featureKey] : undefined;
    if (typeof local === 'boolean') return local;
    if (featureKey === 'enableReports') {
      if (Object.prototype.hasOwnProperty.call(modules, 'reports_enabled')) {
        return Boolean(modules.reports_enabled);
      }
    }
    if (featureKey === 'enableAdminPwa') {
      if (Object.prototype.hasOwnProperty.call(modules, 'pwa_admin_enabled')) {
        return Boolean(modules.pwa_admin_enabled);
      }
    }
    if (featureKey === 'enableSms' || featureKey === 'enableWhatsapp') {
      const notifications = raw.notifications || {};
      const key = featureKey === 'enableSms' ? 'sms' : 'whatsapp';
      if (Object.prototype.hasOwnProperty.call(notifications, key)) {
        return Boolean(notifications[key]);
      }
    }
    return Boolean(local);
  }, [featureKey, flags, featureFlagsRaw]);

  if (!enabled) {
    return fallback;
  }
  return children;
}
