import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercent as formatPct } from '../../utils/format';

export default function RetentionMetrics({ data }) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-10 w-10 text-brand-surfaceForeground/30 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-brand-surfaceForeground/60">
          {t(
            'reports.insights.no_data',
            'Nenhum dado disponível para o período selecionado.'
          )}
        </p>
      </div>
    );
  }

  const newQty = data.new_clients?.qty || 0;
  const returningQty = data.returning_clients?.qty || 0;
  const totalQty = newQty + returningQty;

  const newRevenue = data.new_clients?.revenue || 0;
  const returningRevenue = data.returning_clients?.revenue || 0;
  const totalRevenue = newRevenue + returningRevenue;

  const repeatRate = totalQty > 0 ? returningQty / totalQty : 0;
  const newPct = totalQty > 0 ? (newQty / totalQty) * 100 : 0;
  const returningPct = totalQty > 0 ? (returningQty / totalQty) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Repeat Rate — destaque principal */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-brand-surfaceForeground/70">
              {t('reports.insights.repeat_rate', 'Taxa de Retenção')}
            </h4>
            <p className="text-xs text-brand-surfaceForeground/50 mt-0.5">
              {t(
                'reports.insights.repeat_rate_desc',
                '% de agendamentos de clientes recorrentes'
              )}
            </p>
          </div>
          <div className="text-3xl font-bold text-brand-primary">
            {formatPct(repeatRate)}
          </div>
        </div>

        {/* Split bar */}
        <div className="space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-brand-border">
            <div
              className="h-full bg-brand-primary transition-all"
              style={{ width: `${returningPct.toFixed(1)}%` }}
              title={t('reports.insights.returning_clients', 'Recorrentes')}
            />
            <div
              className="h-full bg-brand-primary/20 transition-all"
              style={{ width: `${newPct.toFixed(1)}%` }}
              title={t('reports.insights.new_clients', 'Novos')}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-brand-surfaceForeground/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-primary" />
              {t('reports.insights.returning_clients', 'Recorrentes')} (
              {returningPct.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-primary/20 border border-brand-border" />
              {t('reports.insights.new_clients', 'Novos')} ({newPct.toFixed(0)}
              %)
            </span>
          </div>
        </div>
      </div>

      {/* Cartões de detalhe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Novos Clientes */}
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-brand-surfaceForeground/70">
              {t('reports.insights.new_clients', 'Novos Clientes')}
            </h4>
            <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-brand-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold text-brand-surfaceForeground">
                {newQty}
              </div>
              <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                {t('reports.insights.clients_count', 'Clientes cadastrados')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-brand-primary">
                {formatCurrency(newRevenue)}
              </div>
              <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                {t('reports.insights.revenue_generated', 'Receita gerada')}
              </div>
              {totalRevenue > 0 && (
                <div className="text-xs text-brand-surfaceForeground/40 mt-0.5">
                  {formatPct(newRevenue / totalRevenue)} do total
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clientes Recorrentes */}
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-brand-surfaceForeground/70">
              {t('reports.insights.returning_clients', 'Clientes Recorrentes')}
            </h4>
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold text-brand-surfaceForeground">
                {returningQty}
              </div>
              <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                {t(
                  'reports.insights.clients_count_returning',
                  'Clientes que retornaram'
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-brand-primary">
                {formatCurrency(returningRevenue)}
              </div>
              <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                {t('reports.insights.revenue_generated', 'Receita gerada')}
              </div>
              {totalRevenue > 0 && (
                <div className="text-xs text-brand-surfaceForeground/40 mt-0.5">
                  {formatPct(returningRevenue / totalRevenue)} do total
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
