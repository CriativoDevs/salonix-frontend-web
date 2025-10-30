import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BasicReportsMetrics({ data }) {
  const { t } = useTranslation();

  if (!data) {
    return null;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const metrics = [
    {
      title: t('reports.metrics.total_appointments', 'Total de Agendamentos'),
      value: formatNumber(data.appointments_total),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
    },
    {
      title: t('reports.metrics.completed_appointments', 'Agendamentos Concluídos'),
      value: formatNumber(data.appointments_completed),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    },
    {
      title: t('reports.metrics.total_revenue', 'Receita Total'),
      value: formatCurrency(data.revenue_total),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
    },
    {
      title: t('reports.metrics.average_ticket', 'Ticket Médio'),
      value: formatCurrency(data.avg_ticket),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-brand-border p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${metric.color}`}>
              {metric.icon}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-brand-surfaceForeground/70">
                {metric.title}
              </p>
              <p className="text-2xl font-semibold text-brand-surfaceForeground">
                {metric.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}