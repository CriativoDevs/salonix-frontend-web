import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdvancedFilters({
  interval,
  onIntervalChange,
  loading,
  professionalOptions,
  professionalId,
  onProfessionalChange,
  serviceOptions,
  serviceId,
  onServiceChange,
}) {
  const { t } = useTranslation();

  const intervals = [
    { value: 'day', label: t('reports.advanced.intervals.day', 'Diário') },
    { value: 'week', label: t('reports.advanced.intervals.week', 'Semanal') },
    { value: 'month', label: t('reports.advanced.intervals.month', 'Mensal') }
  ];

  const showProfessionalFilter =
    Array.isArray(professionalOptions) && typeof onProfessionalChange === 'function';
  const showServiceFilter =
    Array.isArray(serviceOptions) && typeof onServiceChange === 'function';

  return (
    <div className="bg-brand-light/20 rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-medium text-brand-surfaceForeground">
        {t('reports.advanced.filters.title', 'Filtros Avançados')}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interval Filter */}
        <div>
          <label
            htmlFor="advanced-filters-interval"
            className="block text-sm font-medium text-brand-surfaceForeground/70 mb-2"
          >
            {t('reports.advanced.filters.interval', 'Intervalo de Tempo')}
          </label>
          <select
            id="advanced-filters-interval"
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

        {/* Professional Filter (Top Services only) */}
        {showProfessionalFilter && (
          <div>
            <label
              htmlFor="advanced-filters-professional"
              className="block text-sm font-medium text-brand-surfaceForeground/70 mb-2"
            >
              {t('reports.advanced.filters.professional', 'Profissional')}
            </label>
            <select
              id="advanced-filters-professional"
              value={professionalId || ''}
              onChange={(e) => onProfessionalChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-brand-border rounded-md bg-brand-surface text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {t('reports.advanced.filters.all_professionals', 'Todos os profissionais')}
              </option>
              {professionalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Filter (Top Services only) */}
        {showServiceFilter && (
          <div>
            <label
              htmlFor="advanced-filters-service"
              className="block text-sm font-medium text-brand-surfaceForeground/70 mb-2"
            >
              {t('reports.advanced.filters.service', 'Serviço')}
            </label>
            <select
              id="advanced-filters-service"
              value={serviceId || ''}
              onChange={(e) => onServiceChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-brand-border rounded-md bg-brand-surface text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {t('reports.advanced.filters.all_services', 'Todos os serviços')}
              </option>
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="text-xs text-brand-surfaceForeground/60">
        {t('reports.advanced.filters.help', 'Ajuste os filtros para personalizar a visualização dos dados')}
      </div>
    </div>
  );
}