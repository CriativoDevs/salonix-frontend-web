import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TableLoadingSpinner from '../ui/TableLoadingSpinner';

export default function RevenueChart({ data, loading, interval = 'day' }) {
  const { t } = useTranslation();

  // Usar a estrutura correta dos dados: data.revenue.series
  const revenueData = useMemo(() => {
    return data?.revenue?.series || [];
  }, [data?.revenue?.series]);

  // Os dados já vêm filtrados pelo intervalo do backend
  const filteredData = useMemo(() => {
    return revenueData;
  }, [revenueData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-brand-surfaceForeground/10 rounded w-40 animate-pulse" />
        <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
          <div className="space-y-2">
            <div className="h-4 bg-brand-surfaceForeground/10 rounded w-full animate-pulse" />
            <div className="h-4 bg-brand-surfaceForeground/10 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-brand-surfaceForeground/10 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!revenueData.length) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-surfaceForeground/60">
          {t(
            'reports.advanced.no_revenue',
            'Nenhum dado de receita encontrado no período selecionado'
          )}
        </p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    switch (interval) {
      case 'day':
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
      case 'week':
        return `Sem ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
      case 'month':
        return date.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        });
      default:
        return date.toLocaleDateString('pt-BR');
    }
  };

  // Calcular estatísticas
  const totalRevenue = filteredData.reduce(
    (sum, item) => sum + (item.revenue || 0),
    0
  );
  const averageRevenue =
    filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
  const maxRevenue = Math.max(...filteredData.map((item) => item.revenue || 0));

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-light/30 rounded-lg p-4">
          <div className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.revenue.total', 'Receita Total')}
          </div>
          <div className="text-2xl font-bold text-brand-surfaceForeground">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="bg-brand-light/30 rounded-lg p-4">
          <div className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.revenue.average', 'Média por Período')}
          </div>
          <div className="text-2xl font-bold text-brand-surfaceForeground">
            {formatCurrency(averageRevenue)}
          </div>
        </div>
        <div className="bg-brand-light/30 rounded-lg p-4">
          <div className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.revenue.peak', 'Pico de Receita')}
          </div>
          <div className="text-2xl font-bold text-brand-surfaceForeground">
            {formatCurrency(maxRevenue)}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="min-w-[720px] divide-y divide-brand-border sm:min-w-full">
          <thead className="bg-brand-light/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-surfaceForeground/70 sm:px-6">
                {t('reports.advanced.revenue.period', 'Período')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-surfaceForeground/70 sm:px-6">
                {t('reports.advanced.revenue.revenue', 'Receita')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-surfaceForeground/70 sm:px-6">
                {t('reports.advanced.revenue.appointments', 'Agendamentos')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-surfaceForeground/70 sm:px-6">
                {t('reports.advanced.revenue.avg_ticket', 'Ticket Médio')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-border">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-brand-light/20">
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-brand-surfaceForeground sm:px-6">
                  {formatDate(item.period_start)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-brand-surfaceForeground sm:px-6">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-brand-surfaceForeground sm:px-6">
                  {item.appointment_count || 0}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-brand-surfaceForeground sm:px-6">
                  {formatCurrency(
                    item.appointment_count > 0
                      ? item.revenue / item.appointment_count
                      : 0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
