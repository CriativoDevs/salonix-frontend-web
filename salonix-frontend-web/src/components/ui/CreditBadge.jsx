import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCreditBalance from '../../hooks/useCreditBalance';

export default function CreditBadge({ className = '' }) {
  const { t } = useTranslation();
  const { balance, loading, error, refresh } = useCreditBalance();
  // Estado removido: atualização manual basta para este modo

  const handleRefresh = () => {
    if (loading) return;
    refresh();
  };

  const content = useMemo(() => {
    if (loading) return t('credits.loading', 'Carregando créditos...');
    if (error) return t('credits.unavailable', 'Créditos indisponíveis');
    if (!balance || typeof balance.current_balance === 'undefined') return '—';
    return String(balance.current_balance);
  }, [loading, error, balance, t]);

  return (
    <span
      role="button"
      onClick={handleRefresh}
      title={
        loading
          ? t('credits.loading', 'Carregando créditos...')
          : t('credits.refresh_hint', 'Clique para atualizar o saldo')
      }
      className={`cursor-pointer rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground ${className}`}
    >
      {t('credits.label', 'Créditos')}: {content}
    </span>
  );
}