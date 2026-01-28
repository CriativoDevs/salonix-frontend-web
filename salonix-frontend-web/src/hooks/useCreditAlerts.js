import { useState, useMemo } from 'react';
import useCreditBalance from './useCreditBalance';

const STORAGE_KEY = 'salonix_credit_alerts';
const DEFAULT_SETTINGS = {
  threshold: 1,
  enabled: true,
};

/**
 * Hook para gerenciar alertas de saldo de créditos.
 * Verifica o saldo atual em relação a um limite configurado.
 */
export default function useCreditAlerts() {
  const { balance, refresh } = useCreditBalance();
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const saveSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const alertStatus = useMemo(() => {
    // Se não tiver saldo carregado ou alertas desabilitados, retorna none
    if (!settings.enabled || !balance) return { level: 'none', type: 'normal' };

    const current = balance.current_balance;

    if (current <= 0) {
      return { level: 'critical', type: 'exhausted' };
    }
    if (current < settings.threshold) {
      return { level: 'warning', type: 'low' };
    }
    return { level: 'none', type: 'normal' };
  }, [balance, settings]);

  return {
    status: alertStatus,
    balance: balance?.current_balance,
    settings,
    updateSettings: saveSettings,
    refreshBalance: refresh,
  };
}
