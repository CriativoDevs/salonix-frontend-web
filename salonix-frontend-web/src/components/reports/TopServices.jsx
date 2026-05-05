import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TableLoadingSpinner from '../ui/TableLoadingSpinner';
import { formatCurrency } from '../../utils/format';

const RANK_STYLES = [
  'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400', // 1st
  'bg-gray-300/30 text-gray-500 dark:text-gray-400', // 2nd
  'bg-orange-300/20 text-orange-600 dark:text-orange-400', // 3rd
];

const RANK_LABELS = ['🥇', '🥈', '🥉'];

function SortIcon({ dir }) {
  if (!dir) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function TopServices({ data, loading, limit = 25 }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

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
          {t(
            'reports.advanced.no_services',
            'Nenhum serviço encontrado no período selecionado'
          )}
        </p>
      </div>
    );
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const rawServices = data.top_services || [];

  const sortedServices = useMemo(() => {
    return [...rawServices].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'avg_price') {
        aVal = a.qty > 0 ? a.revenue / a.qty : 0;
        bVal = b.qty > 0 ? b.revenue / b.qty : 0;
      } else {
        aVal = a[sortKey] || 0;
        bVal = b[sortKey] || 0;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [rawServices, sortKey, sortDir]);

  const maxRevenue = useMemo(
    () => Math.max(...sortedServices.map((s) => s.revenue || 0), 0),
    [sortedServices]
  );

  const itemsPerPage = limit;
  const totalPages = Math.ceil(sortedServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = sortedServices.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="min-w-[760px] divide-y divide-brand-border sm:min-w-full">
          <thead className="bg-brand-light/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider min-w-48">
                {t('reports.advanced.top_services.service', 'Serviço')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-32 cursor-pointer select-none hover:text-brand-primary"
                onClick={() => toggleSort('qty')}
              >
                {t(
                  'reports.advanced.top_services.appointments',
                  'Agendamentos'
                )}
                <SortIcon dir={sortKey === 'qty' ? sortDir : null} />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-48 cursor-pointer select-none hover:text-brand-primary"
                onClick={() => toggleSort('revenue')}
              >
                {t('reports.advanced.top_services.revenue', 'Receita')}
                <SortIcon dir={sortKey === 'revenue' ? sortDir : null} />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-surfaceForeground/70 uppercase tracking-wider w-32 cursor-pointer select-none hover:text-brand-primary"
                onClick={() => toggleSort('avg_price')}
              >
                {t('reports.advanced.top_services.avg_price', 'Preço Médio')}
                <SortIcon dir={sortKey === 'avg_price' ? sortDir : null} />
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-border">
            {currentServices.map((service, index) => {
              const globalIndex = startIndex + index;
              const isTop3 = globalIndex < 3;
              const avgPrice =
                service.qty > 0 ? service.revenue / service.qty : 0;
              const revenueBarPct =
                maxRevenue > 0 ? (service.revenue / maxRevenue) * 100 : 0;
              return (
                <tr
                  key={service.service_id || index}
                  className={`hover:bg-brand-light/20 ${isTop3 ? 'font-medium' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {isTop3 ? (
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${RANK_STYLES[globalIndex]}`}
                      >
                        {RANK_LABELS[globalIndex]}
                      </span>
                    ) : (
                      <span className="text-brand-surfaceForeground/60">
                        {globalIndex + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-brand-surfaceForeground">
                      {service.service_name}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                    {service.qty || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                    <div>{formatCurrency(service.revenue)}</div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-brand-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary/60 transition-all"
                        style={{ width: `${revenueBarPct.toFixed(1)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-surfaceForeground">
                    {formatCurrency(avgPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-brand-surfaceForeground/60">
            {t(
              'reports.advanced.pagination.showing',
              'Mostrando {{start}} a {{end}} de {{total}} serviços',
              {
                start: startIndex + 1,
                end: Math.min(endIndex, sortedServices.length),
                total: sortedServices.length,
              }
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-brand-border rounded-md text-brand-surfaceForeground hover:bg-brand-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('reports.advanced.pagination.previous', 'Anterior')}
            </button>
            <span className="px-3 py-1 text-sm text-brand-surfaceForeground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
