import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function RevenueChart({ data, loading, onExport, interval = 'day' }) {
  const { t } = useTranslation();
  const [selectedInterval, setSelectedInterval] = useState(interval);

  // Usar a estrutura correta dos dados: data.revenue.series
  const revenueData = data?.revenue?.series || [];
  
  // Os dados já vêm filtrados pelo intervalo do backend
  const filteredData = useMemo(() => {
    return revenueData;
  }, [revenueData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <span className="ml-3 text-brand-surfaceForeground/70">
          {t('reports.loading', 'Carregando relatórios...')}
        </span>
      </div>
    );
  }
  
  if (!revenueData.length) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-surfaceForeground/60">
          {t('reports.advanced.no_revenue', 'Nenhum dado de receita encontrado no período selecionado')}
        </p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    switch (selectedInterval) {
      case 'day':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case 'week':
        return `Sem ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
      case 'month':
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString('pt-BR');
    }
  };

  // Filtrar dados por intervalo selecionado - removendo duplicata
  const intervals = [
    { value: 'day', label: t('reports.advanced.intervals.day', 'Diário') },
    { value: 'week', label: t('reports.advanced.intervals.week', 'Semanal') },
    { value: 'month', label: t('reports.advanced.intervals.month', 'Mensal') }
  ];

  // Calcular estatísticas
  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const averageRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
  const maxRevenue = Math.max(...filteredData.map(item => item.revenue || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-brand-surfaceForeground">
            {t('reports.advanced.revenue.title', 'Receita por Período')}
          </h4>
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.revenue.description', 'Evolução da receita ao longo do tempo')}
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors text-sm"
          >
            {t('reports.export.csv', 'Exportar CSV')}
          </button>
        )}
      </div>

      {/* Interval Selector */}
      <div className="flex space-x-2">
        {intervals.map((interval) => (
          <button
            key={interval.value}
            onClick={() => setSelectedInterval(interval.value)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedInterval === interval.value
                ? 'bg-brand-primary text-brand-primaryForeground'
                : 'bg-brand-light/30 text-brand-surfaceForeground hover:bg-brand-light/50'
            }`}
          >
            {interval.label}
          </button>
        ))}
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

      {/* Simple Bar Chart */}
      <div className="bg-brand-light/20 rounded-lg p-6">
        <div className="space-y-3">
          {filteredData.map((item, index) => {
            const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-brand-surfaceForeground/70 text-right">
                  {formatDate(item.period_start)}
                </div>
                <div className="flex-1 bg-brand-light/30 rounded-full h-6 relative">
                  <div
                    className="bg-brand-primary h-6 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-brand-surfaceForeground">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
                <div className="w-16 text-sm text-brand-surfaceForeground/70">
                  {item.appointment_count || 0} agend.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-brand-border">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-light/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.revenue.period', 'Período')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.revenue.revenue', 'Receita')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.revenue.appointments', 'Agendamentos')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.revenue.avg_ticket', 'Ticket Médio')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-border">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-brand-light/20">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {formatDate(item.period_start)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                  {item.appointment_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                  {formatCurrency(item.appointment_count > 0 ? item.revenue / item.appointment_count : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}