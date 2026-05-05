import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TableLoadingSpinner from '../ui/TableLoadingSpinner';

export default function RevenueChart({ data, loading, interval = 'day' }) {
  const { t } = useTranslation();
  const [view, setView] = useState('chart'); // 'chart' | 'table'

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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-brand-surfaceForeground/60">
          {t(
            'reports.advanced.no_revenue',
            'Nenhum dado de receita encontrado no período selecionado'
          )}
        </p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
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

  const chartData = useMemo(
    () =>
      filteredData.map((item) => ({
        label: formatDate(item.period_start),
        revenue: item.revenue || 0,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredData, interval]
  );

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView('chart')}
          className={`text-sm transition-colors ${
            view === 'chart'
              ? 'text-brand-primary underline font-medium'
              : 'text-brand-surfaceForeground/60 hover:text-brand-primary hover:underline'
          }`}
        >
          {t('reports.advanced.revenue.view_chart', 'Gráfico')}
        </button>
        <button
          onClick={() => setView('table')}
          className={`text-sm transition-colors ${
            view === 'table'
              ? 'text-brand-primary underline font-medium'
              : 'text-brand-surfaceForeground/60 hover:text-brand-primary hover:underline'
          }`}
        >
          {t('reports.advanced.revenue.view_table', 'Tabela')}
        </button>
      </div>

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

      {/* Bar Chart */}
      {view === 'chart' && (
        <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e7eb)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(v)
                }
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(value),
                  t('reports.advanced.revenue.revenue', 'Receita'),
                ]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  background: 'var(--color-surface, #fff)',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-primary, #6366f1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      {view === 'table' && (
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
      )}
    </div>
  );
}
