import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BasicReportsMetrics({ data }) {
  const { t, i18n } = useTranslation();

  if (!data) {
    return null;
  }

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language || 'pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat(i18n.language || 'pt-BR').format(value || 0);
  };

  const formatSignedValue = (value, formatter) => {
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${prefix}${formatter(Math.abs(value))}`;
  };

  const comparisonSources = [
    data?.comparison,
    data?.overview?.comparison,
    data?.overview_comparison,
    data?.summary?.comparison,
    data?.summary_comparison,
  ].filter(Boolean);

  const normalizeComparison = (rawComparison) => {
    if (!rawComparison && rawComparison !== 0) return null;

    if (typeof rawComparison === 'number') {
      return {
        delta: toNumber(rawComparison),
        deltaPercent: null,
      };
    }

    if (typeof rawComparison === 'object') {
      const delta =
        rawComparison.delta ??
        rawComparison.diff ??
        rawComparison.change ??
        rawComparison.value;

      const deltaPercent =
        rawComparison.delta_pct ??
        rawComparison.deltaPercent ??
        rawComparison.change_percent ??
        rawComparison.changePercent ??
        rawComparison.percentage;

      if (delta === undefined && deltaPercent === undefined) return null;

      return {
        delta: delta !== undefined ? toNumber(delta) : null,
        deltaPercent:
          deltaPercent !== undefined ? toNumber(deltaPercent) : null,
      };
    }

    return null;
  };

  const getComparison = (metricKey) => {
    for (const source of comparisonSources) {
      if (source && Object.prototype.hasOwnProperty.call(source, metricKey)) {
        return normalizeComparison(source[metricKey]);
      }
    }
    return null;
  };

  const getComparisonLabel = (comparison, type = 'number') => {
    if (!comparison) return null;

    const deltaValue =
      comparison.deltaPercent !== null && comparison.deltaPercent !== undefined
        ? formatSignedValue(
            comparison.deltaPercent,
            (value) => `${value.toFixed(1)}%`
          )
        : comparison.delta !== null && comparison.delta !== undefined
          ? type === 'currency'
            ? formatSignedValue(comparison.delta, formatCurrency)
            : formatSignedValue(comparison.delta, formatNumber)
          : null;

    if (!deltaValue) return null;

    return t(
      'reports.metrics.period_comparison',
      '{{delta}} vs período anterior',
      {
        delta: deltaValue,
      }
    );
  };

  const totalAppointments = toNumber(
    data.overview?.appointments_total ?? data.appointments_total
  );
  const completedAppointments = toNumber(
    data.overview?.appointments_completed ?? data.appointments_completed
  );
  const totalRevenue = toNumber(
    data.overview?.revenue_total ?? data.revenue_total
  );
  const averageTicket = toNumber(data.overview?.avg_ticket ?? data.avg_ticket);

  const completionRate =
    totalAppointments > 0
      ? `${((completedAppointments / totalAppointments) * 100).toFixed(1)}%`
      : '0.0%';
  const averageRevenuePerAppointment =
    completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

  const metrics = [
    {
      title: t('reports.metrics.total_appointments', 'Total de Agendamentos'),
      value: formatNumber(totalAppointments),
      detail: t('reports.metrics.period_total', 'Total no período selecionado'),
      comparison: getComparisonLabel(getComparison('appointments_total')),
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-blue-700 bg-blue-100',
    },
    {
      title: t(
        'reports.metrics.completed_appointments',
        'Agendamentos Concluídos'
      ),
      value: formatNumber(completedAppointments),
      detail: t(
        'reports.metrics.completion_rate',
        'Taxa de conclusão: {{rate}}',
        {
          rate: completionRate,
        }
      ),
      comparison: getComparisonLabel(getComparison('appointments_completed')),
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      title: t('reports.metrics.total_revenue', 'Receita Total'),
      value: formatCurrency(totalRevenue),
      detail: t(
        'reports.metrics.revenue_per_appointment',
        'Receita média por atendimento: {{value}}',
        {
          value: formatCurrency(averageRevenuePerAppointment),
        }
      ),
      comparison: getComparisonLabel(
        getComparison('revenue_total'),
        'currency'
      ),
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      color: 'text-amber-700 bg-amber-100',
    },
    {
      title: t('reports.metrics.average_ticket', 'Ticket Médio'),
      value: formatCurrency(averageTicket),
      detail: t(
        'reports.metrics.ticket_source',
        'Calculado sobre atendimentos concluídos'
      ),
      comparison: getComparisonLabel(getComparison('avg_ticket'), 'currency'),
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: 'text-violet-700 bg-violet-100',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-brand-surfaceForeground/60">
              {metric.title}
            </p>
            <div className={`rounded-lg p-2 ${metric.color}`}>
              {metric.icon}
            </div>
          </div>

          <p className="text-2xl font-semibold leading-tight text-brand-surfaceForeground">
            {metric.value}
          </p>

          <p className="mt-2 text-xs text-brand-surfaceForeground/60">
            {metric.detail}
          </p>

          {metric.comparison && (
            <p className="mt-2 inline-flex rounded-full bg-brand-light/60 px-2 py-0.5 text-xs font-medium text-brand-surfaceForeground/80">
              {metric.comparison}
            </p>
          )}

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-border/40">
            <div
              className="h-full w-2/3 rounded-full bg-brand-primary/70"
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
