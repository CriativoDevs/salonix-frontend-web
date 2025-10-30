import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DateFilters({ fromDate, toDate, onFromDateChange, onToDateChange, onApplyFilters, loading }) {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters();
  };

  // Função para formatar data para input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Definir data padrão (últimos 30 dias)
  const getDefaultFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateForInput(date);
  };

  const getDefaultToDate = () => {
    return formatDateForInput(new Date());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-brand-border p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="from-date" className="block text-sm font-medium text-brand-surfaceForeground mb-1">
            {t('reports.filters.from_date', 'Data inicial')}
          </label>
          <input
            type="date"
            id="from-date"
            value={fromDate || getDefaultFromDate()}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="flex-1">
          <label htmlFor="to-date" className="block text-sm font-medium text-brand-surfaceForeground mb-1">
            {t('reports.filters.to_date', 'Data final')}
          </label>
          <input
            type="date"
            id="to-date"
            value={toDate || getDefaultToDate()}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-primary text-brand-primaryForeground rounded-lg font-medium hover:bg-brand-primaryHover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('reports.filters.applying', 'Aplicando...')}
            </div>
          ) : (
            t('reports.filters.apply', 'Aplicar filtros')
          )}
        </button>
      </form>
      
      <div className="mt-3 text-xs text-brand-surfaceForeground/60">
        {t('reports.filters.help', 'Selecione o período para filtrar os dados dos relatórios')}
      </div>
    </div>
  );
}