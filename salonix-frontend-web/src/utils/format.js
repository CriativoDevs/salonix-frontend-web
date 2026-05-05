/**
 * Utilitários de formatação compartilhados.
 * Moeda padrão: EUR, locale pt-BR.
 */

export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_LOCALE = 'pt-BR';

export const formatCurrency = (value, currency = DEFAULT_CURRENCY) =>
  new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency }).format(
    value || 0
  );

export const formatPercent = (value, maxFractionDigits = 1) =>
  new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'percent',
    maximumFractionDigits: maxFractionDigits,
  }).format(value || 0);
