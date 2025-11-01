import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TopServices({ data, loading, onExport, limit = 25 }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);


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

  if (!data?.top_services?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-surfaceForeground/60">
          {t('reports.advanced.no_services', 'Nenhum serviço encontrado no período selecionado')}
        </p>
      </div>
    );
  }

  const services = data.top_services || [];
  const itemsPerPage = limit;
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = services.slice(startIndex, endIndex);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-brand-surfaceForeground">
            {t('reports.advanced.top_services.title', 'Serviços Mais Populares')}
          </h4>
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.top_services.description', 'Ranking dos serviços por número de agendamentos')}
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-brand-border">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-light/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.top_services.service', 'Serviço')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.top_services.appointments', 'Agendamentos')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.top_services.revenue', 'Receita')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider">
                {t('reports.advanced.top_services.avg_price', 'Preço Médio')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-border">
            {currentServices.map((service, index) => (
              <tr key={service.service_id || index} className="hover:bg-brand-light/20">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-brand-surfaceForeground">
                    {service.service_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                  {service.qty || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {formatCurrency(service.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                  {formatCurrency(service.qty > 0 ? service.revenue / service.qty : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-brand-surfaceForeground/60">
            {t('reports.advanced.pagination.showing', 'Mostrando {{start}} a {{end}} de {{total}} serviços', {
              start: startIndex + 1,
              end: Math.min(endIndex, services.length),
              total: services.length
            })}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-brand-border rounded-md text-brand-surfaceForeground hover:bg-brand-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('reports.advanced.pagination.previous', 'Anterior')}
            </button>
            <span className="px-3 py-1 text-sm text-brand-surfaceForeground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-brand-border rounded-md text-brand-surfaceForeground hover:bg-brand-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('reports.advanced.pagination.next', 'Próximo')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}