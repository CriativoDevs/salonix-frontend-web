import { useMemo } from 'react';
import { useTenant } from '../../hooks/useTenant';

export default function FeatureGate({ featureKey, children, fallback = null }) {
  const { flags, featureFlagsRaw } = useTenant();

  const enabled = useMemo(() => {
    if (!featureKey) return true;
    const local = flags && typeof flags === 'object' ? flags[featureKey] : undefined;
    if (typeof local === 'boolean') return local;
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
