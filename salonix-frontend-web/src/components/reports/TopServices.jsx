import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TableLoadingSpinner from '../ui/TableLoadingSpinner';

export default function TopServices({ data, loading, limit = 25 }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);


  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-brand-surfaceForeground/10 rounded w-48 animate-pulse" />
            <div className="h-4 bg-brand-surfaceForeground/10 rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-8 bg-brand-surfaceForeground/10 rounded w-24 animate-pulse" />
        </div>

        {/* Table Loading */}
        <div className="overflow-hidden rounded-lg border border-brand-border">
          <div className="bg-brand-light/30 px-6 py-3">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-brand-surfaceForeground/10 rounded" />
              <div className="h-4 bg-brand-surfaceForeground/10 rounded" />
              <div className="h-4 bg-brand-surfaceForeground/10 rounded" />
              <div className="h-4 bg-brand-surfaceForeground/10 rounded" />
            </div>
          </div>
          <div className="bg-brand-surface p-6">
            <TableLoadingSpinner rows={8} columns={4} />
          </div>
        </div>
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
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-light/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider min-w-48">
                {t('reports.advanced.top_services.service', 'Serviço')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-32">
                {t('reports.advanced.top_services.appointments', 'Agendamentos')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-32">
                {t('reports.advanced.top_services.revenue', 'Receita')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-32">
                {t('reports.advanced.top_services.avg_price', 'Preço Médio')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-border">
            {currentServices.map((service, index) => (
              <tr key={service.service_id || index} className="hover:bg-brand-light/20">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-brand-surfaceForeground">
                    {service.service_name}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                  {service.qty || 0}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-brand-surfaceForeground">
                  {formatCurrency(service.revenue)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
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