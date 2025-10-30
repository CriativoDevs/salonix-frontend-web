import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DateFilters({ fromDate, toDate, onFromDateChange, onToDateChange, onApplyFilters, loading }) {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters();
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="from-date" className="block text-sm font-medium text-brand-surfaceForeground mb-1">
            {t('reports.filters.from_date', 'Data inicial')}
          </label>
          <input
            type="date"
            id="from-date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
              colorScheme: 'light dark'
            }}
          />
        </div>
        
        <div className="flex-1">
          <label htmlFor="to-date" className="block text-sm font-medium text-brand-surfaceForeground mb-1">
            {t('reports.filters.to_date', 'Data final')}
          </label>
          <input
            type="date"
            id="to-date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
              colorScheme: 'light dark'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="text-brand-primary hover:text-brand-primaryHover font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
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