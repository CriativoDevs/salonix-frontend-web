import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  AlertTriangle,
  TrendingDown,
  History,
  BarChart3,
  HelpCircle,
  Download,
} from 'lucide-react';
import Card from '../ui/Card';
import CreditHistoryList from './CreditHistoryList';
import CreditPurchaseModal from '../credits/CreditPurchaseModal';
import useCreditBalance from '../../hooks/useCreditBalance';
import useCreditAlerts from '../../hooks/useCreditAlerts';
import useCreditHistory from '../../hooks/useCreditHistory';
import { useTenant } from '../../hooks/useTenant';

export default function CreditSettings() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const { balance, loading: loadingBalance, refresh } = useCreditBalance();
  const { settings: alertSettings, updateSettings: updateAlertSettings } =
    useCreditAlerts();

  // Fetch history for statistics (last 100 transactions should cover recent activity for stats)
  const { history: statsHistory, loading: loadingStats } = useCreditHistory({
    pageSize: 100,
  });

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const currentBalance = balance?.current_balance ?? 0;
  const planName =
    tenant?.plan?.name || t('common.unknown_plan', 'Plano Desconhecido');

  // Calculate statistics
  const stats = useMemo(() => {
    if (!statsHistory || statsHistory.length === 0) {
      return {
        monthConsumption: 0,
        avgMonthlyConsumption: 0,
        forecastDays: null,
      };
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    // Group consumption by month
    const consumptionByMonth = {};
    let totalConsumption = 0;
    let firstDate = new Date();
    let lastDate = new Date(0);

    statsHistory.forEach((item) => {
      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount >= 0) return; // Skip invalid or additions

      const date = new Date(item.created_at);
      if (date < firstDate) firstDate = date;
      if (date > lastDate) lastDate = date;

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      consumptionByMonth[monthKey] =
        (consumptionByMonth[monthKey] || 0) + Math.abs(amount);
      totalConsumption += Math.abs(amount);
    });

    const monthConsumption = consumptionByMonth[currentMonthKey] || 0;

    // Calculate average monthly consumption
    const months = Object.keys(consumptionByMonth).length;
    const avgMonthlyConsumption = months > 0 ? totalConsumption / months : 0;

    // Calculate daily average for forecast
    // If we have data spanning multiple days, use that range. Otherwise default to 1 day.
    const daySpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    const avgDailyConsumption = totalConsumption / daySpan;

    const forecastDays =
      avgDailyConsumption > 0
        ? Math.floor(currentBalance / avgDailyConsumption)
        : null;

    return {
      monthConsumption,
      avgMonthlyConsumption,
      forecastDays,
    };
  }, [statsHistory, currentBalance]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-brand-surfaceForeground">
          {t('settings.credits.title', 'Gerenciamento de Créditos')}
        </h3>
        <button
          type="button"
          onClick={() => setPurchaseModalOpen(true)}
          className="text-brand-primary hover:underline text-sm font-medium"
        >
          {t('credits.buy', 'Comprar Créditos')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Balance Card */}
        <Card className="p-4 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-light rounded-lg shrink-0">
              <CreditCard className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-surfaceForeground/70 truncate">
                {t('credits.current_balance', 'Saldo Atual')}
              </p>
              <p className="text-2xl font-bold text-brand-surfaceForeground truncate">
                {loadingBalance ? '...' : currentBalance}
              </p>
              <p
                className="text-xs text-brand-surfaceForeground/50 mt-1 truncate"
                title={planName}
              >
                {planName}
              </p>
            </div>
          </div>
        </Card>

        {/* Consumption (Month) */}
        <Card className="p-4 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-surfaceForeground/70 truncate">
                {t('credits.consumption_month', 'Consumo (Mês)')}
              </p>
              <p className="text-xl font-bold text-brand-surfaceForeground truncate">
                {loadingStats ? '...' : stats.monthConsumption.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Average Consumption */}
        <Card className="p-4 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-surfaceForeground/70 truncate">
                {t('credits.avg_consumption', 'Média Mensal')}
              </p>
              <p className="text-xl font-bold text-brand-surfaceForeground truncate">
                {loadingStats ? '...' : stats.avgMonthlyConsumption.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Forecast / Alert */}
        <Card className="p-4 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${alertSettings.enabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-surfaceForeground/70 truncate">
                {t('credits.forecast', 'Previsão')}
              </p>
              <p className="text-sm font-semibold text-brand-surfaceForeground truncate">
                {loadingStats
                  ? '...'
                  : stats.forecastDays !== null
                    ? t('credits.days_remaining', 'approx. {{days}} dias', {
                        days: stats.forecastDays,
                      })
                    : '--'}
              </p>
              {alertSettings.enabled && (
                <p className="text-xs text-brand-surfaceForeground/60 mt-1 truncate">
                  {t('credits.alert_threshold', 'Alerta: < {{val}}', {
                    val: alertSettings.threshold,
                  })}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Configuration */}
      <Card className="p-6 bg-brand-surface border-brand-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="text-base font-medium text-brand-surfaceForeground">
              {t('credits.alert.settings_title', 'Configuração de Alertas')}
            </h4>
            <p className="text-sm text-brand-surfaceForeground/70">
              {t(
                'credits.alert.description',
                'Receba um aviso quando seus créditos estiverem acabando.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {alertSettings.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-brand-surfaceForeground">
                  {t('credits.alert.threshold_prefix', 'Avisar com menos de:')}
                </span>
                <input
                  type="number"
                  min="1"
                  value={alertSettings.threshold}
                  onChange={(e) =>
                    updateAlertSettings({
                      threshold: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-20 rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm text-brand-surfaceForeground"
                />
              </div>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={alertSettings.enabled}
              onClick={() =>
                updateAlertSettings({ enabled: !alertSettings.enabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                alertSettings.enabled ? 'bg-brand-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  alertSettings.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-base font-medium text-brand-surfaceForeground flex items-center gap-2">
            <History className="w-4 h-4" />
            {t('credits.history_title', 'Histórico de Transações')}
          </h4>
        </div>
        <CreditHistoryList />
      </div>

      <div className="flex justify-center pt-4">
        <a
          href="mailto:support@salonix.com?subject=Dúvida sobre Créditos"
          className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
        >
          <HelpCircle className="w-4 h-4" />
          {t(
            'credits.support_link',
            'Dúvidas sobre seus créditos? Fale conosco.'
          )}
        </a>
      </div>

      <CreditPurchaseModal
        open={purchaseModalOpen}
        onClose={() => {
          setPurchaseModalOpen(false);
          refresh(); // Refresh balance after modal closes (potential purchase)
        }}
      />
    </div>
  );
}
