import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdvancedFilters({ 
  interval, 
  onIntervalChange, 
  limit, 
  onLimitChange, 
  loading 
}) {
  const { t } = useTranslation();

  const intervals = [
    { value: 'day', label: t('reports.advanced.intervals.day', 'Diário') },
    { value: 'week', label: t('reports.advanced.intervals.week', 'Semanal') },
    { value: 'month', label: t('reports.advanced.intervals.month', 'Mensal') }
  ];

  const limitOptions = [
    { value: 10, label: '10 itens' },
    { value: 25, label: '25 itens' },
    { value: 50, label: '50 itens' },
    { value: 100, label: '100 itens' }
  ];

  return (
    <div className="bg-brand-light/20 rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-medium text-brand-surfaceForeground">
        {t('reports.advanced.filters.title', 'Filtros Avançados')}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interval Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-surfaceForeground/70 mb-2">
            {t('reports.advanced.filters.interval', 'Intervalo de Tempo')}
          </label>
          <select
            value={interval}
            onChange={(e) => onIntervalChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-brand-border rounded-md bg-brand-surface text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
          >
            {intervals.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Filter */}
        <div>
          <label className="block text-sm font-medium text-brand-surfaceForeground/70 mb-2">
            {t('reports.advanced.filters.limit', 'Itens por Página')}
          </label>
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            disabled={loading}
            className="w-full px-3 py-2 border border-brand-border rounded-md bg-brand-surface text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
          >
            {limitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-brand-surfaceForeground/60">
        {t('reports.advanced.filters.help', 'Ajuste os filtros para personalizar a visualização dos dados')}
      </div>
    </div>
  );
}