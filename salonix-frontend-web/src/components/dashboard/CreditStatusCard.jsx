import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCreditBalance from '../../hooks/useCreditBalance';

export default function CreditStatusCard() {
  const { t } = useTranslation();
  const { balance, loading, error, refresh } = useCreditBalance();

  const creditValue = balance?.current_balance ?? 0;

  // Determine status
  const status = useMemo(() => {
    if (loading || error) return 'neutral';
    if (creditValue <= 0) return 'critical';
    if (creditValue < 10) return 'low';
    return 'good';
  }, [creditValue, loading, error]);

  // Styles based on status
  const statusColors = {
    neutral: 'text-brand-surfaceForeground',
    good: 'text-green-600 dark:text-green-400',
    low: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400',
  };

  const statusBg = {
    neutral: 'bg-brand-surface ring-brand-border',
    good: 'bg-green-50 dark:bg-green-900/10 ring-green-100 dark:ring-green-900/20',
    low: 'bg-yellow-50 dark:bg-yellow-900/10 ring-yellow-100 dark:ring-yellow-900/20',
    critical: 'bg-red-50 dark:bg-red-900/10 ring-red-100 dark:ring-red-900/20',
  };

  const currentStatusColor = statusColors[status];
  const currentStatusBg = statusBg[status];

  const handleRefresh = (e) => {
    e.preventDefault();
    e.stopPropagation();
    refresh();
  };

  return (
    <div className={`rounded-xl p-5 shadow-sm ring-1 ${currentStatusBg}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand-surfaceForeground/70">
            {t('dashboard.stats.credits', 'Créditos')}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className={`rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
              title={t('common.refresh', 'Atualizar')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>
          </div>
          <div className={`mt-1 text-2xl font-semibold ${currentStatusColor}`}>
            {loading
              ? '...'
              : new Intl.NumberFormat('pt-BR', {
                  minimumFractionDigits: 2,
                }).format(creditValue)}
          </div>
        </div>
      </div>

      {!loading && !error && (
        <div className="mt-1 text-xs text-brand-surfaceForeground/70">
          {status === 'critical' &&
            t('dashboard.credits_critical', 'Saldo esgotado')}
          {status === 'low' && t('dashboard.credits_low', 'Saldo baixo')}
          {status === 'good' && t('dashboard.credits_good', 'Saldo disponível')}
        </div>
      )}
    </div>
  );
}
