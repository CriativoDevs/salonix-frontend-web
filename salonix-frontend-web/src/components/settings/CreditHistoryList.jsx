import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card';
import PaginationControls from '../ui/PaginationControls';
import useCreditHistory from '../../hooks/useCreditHistory';

export default function CreditHistoryList() {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Local state for filter inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { history, meta, page, setPage, loading, error, setFilters } =
    useCreditHistory({ pageSize });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getTransactionInfo = (item) => {
    if (!item) return null;
    const desc = String(item.description || '').toLowerCase();

    // Padrões específicos
    if (desc.includes('via stripe checkout')) {
      return { key: 'purchase_stripe', isConsumption: false };
    }
    if (desc.includes('compra de créditos extras')) {
      return { key: 'purchase_extras', isConsumption: false };
    }
    const originalDesc = String(item.description || '');
    const amountMatch = originalDesc.match(/Compra de (.*?) em créditos/i);
    if (amountMatch) {
      return {
        key: 'purchase_amount',
        params: { amount: amountMatch[1] },
        isConsumption: false,
      };
    }
    if (desc.includes('whatsapp')) {
      return { key: 'consumption_whatsapp', isConsumption: true };
    }
    if (desc.includes('sms')) {
      return { key: 'consumption_sms', isConsumption: true };
    }
    if (desc.includes('iniciais do plano')) {
      return { key: 'bonus_initial', isConsumption: false };
    }

    // Tipo vindo do backend
    if (item.transaction_type) {
      const type = String(item.transaction_type).toLowerCase().trim();
      const isConsumption =
        type.includes('consumption') ||
        type.includes('usage') ||
        type.includes('fee');
      return { key: type, isConsumption };
    }

    // Fallback genérico
    if (desc.includes('compra') || desc.includes('purchase'))
      return { key: 'purchase', isConsumption: false };
    if (
      desc.includes('uso') ||
      desc.includes('usage') ||
      desc.includes('consumo') ||
      desc.includes('envio')
    )
      return { key: 'consumption', isConsumption: true };
    if (desc.includes('expir') || desc.includes('venc'))
      return { key: 'expiration', isConsumption: true };
    if (desc.includes('reembolso') || desc.includes('refund'))
      return { key: 'refund', isConsumption: false };
    if (desc.includes('bônus') || desc.includes('bonus'))
      return { key: 'bonus', isConsumption: false };

    return null;
  };

  const handleApplyFilters = () => {
    setFilters({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: typeFilter || undefined,
    });
    setPage(1);
  };

  const toggleExpand = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/10">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">
              {t('credits.filters.from_date', 'De')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">
              {t('credits.filters.to_date', 'Até')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">
              {t('credits.filters.type', 'Tipo')}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white"
            >
              <option value="">{t('common.all', 'Todos')}</option>
              <option value="purchase">
                {t('credits.types.purchase', 'Compra')}
              </option>
              <option value="consumption">
                {t('credits.types.consumption', 'Consumo')}
              </option>
              <option value="bonus">{t('credits.types.bonus', 'Bônus')}</option>
              <option value="refund">
                {t('credits.types.refund', 'Reembolso')}
              </option>
              <option value="expiration">
                {t('credits.types.expiration', 'Expiração')}
              </option>
            </select>
          </div>
          <button
            onClick={handleApplyFilters}
            className="mt-5 text-sm font-medium text-brand-primary hover:underline bg-transparent"
          >
            {t('common.filter', 'Filtrar')}
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3">{t('common.date', 'Data')}</th>
                <th className="px-4 py-3">
                  {t('common.description', 'Descrição')}
                </th>
                <th className="px-4 py-3 text-right">
                  {t('common.value', 'Valor')}
                </th>
                <th className="px-4 py-3 text-right">
                  {t('common.balance', 'Saldo')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading && !history?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t('common.loading', 'Carregando...')}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    {t('credits.history_error', 'Erro ao carregar histórico.')}
                  </td>
                </tr>
              ) : !history?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t(
                      'credits.history_empty',
                      'Nenhuma transação encontrada.'
                    )}
                  </td>
                </tr>
              ) : (
                history.map((item, index) => {
                  const info = getTransactionInfo(item);
                  const isNegative =
                    info?.isConsumption || (item.amount_eur || 0) < 0;
                  const amountValue = Math.abs(item.amount_eur || 0);
                  const isExpanded = expandedRows.has(item.id || index);

                  return (
                    <React.Fragment key={item.id || index}>
                      <tr
                        onClick={() => toggleExpand(item.id || index)}
                        className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-white">
                          {info
                            ? t(`credits.types.${info.key}`, {
                                defaultValue: item.description,
                                ...info.params,
                              })
                            : item.description ||
                              t('credits.transaction_no_desc', 'Sem descrição')}
                        </td>
                        <td
                          className={`px-4 py-4 text-right font-medium ${
                            isNegative
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {isNegative ? '-' : '+'}
                          {new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 2,
                          }).format(amountValue)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300">
                          {item.balance_after !== undefined &&
                          item.balance_after !== null
                            ? new Intl.NumberFormat('pt-BR', {
                                minimumFractionDigits: 2,
                              }).format(item.balance_after)
                            : '-'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/50 dark:bg-white/5">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-semibold block mb-1">
                                  ID da Transação:
                                </span>
                                {item.id}
                              </div>
                              {item.reference_id && (
                                <div>
                                  <span className="font-semibold block mb-1">
                                    Referência Externa:
                                  </span>
                                  {item.reference_id}
                                </div>
                              )}
                              {item.transaction_type && (
                                <div>
                                  <span className="font-semibold block mb-1">
                                    Tipo Técnico:
                                  </span>
                                  {item.transaction_type}
                                </div>
                              )}
                              {item.status && (
                                <div>
                                  <span className="font-semibold block mb-1">
                                    Status:
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      item.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : item.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              )}
                              {item.created_by && (
                                <div>
                                  <span className="font-semibold block mb-1">
                                    Criado por:
                                  </span>
                                  {typeof item.created_by === 'object'
                                    ? item.created_by.username ||
                                      item.created_by.email
                                    : item.created_by}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.count > 0 && (
          <div className="border-t border-gray-100 dark:border-white/10 p-4">
            <PaginationControls
              totalCount={meta.count}
              limit={pageSize}
              offset={(page - 1) * pageSize}
              onChangeLimit={(newLimit) => {
                setPageSize(newLimit);
                setPage(1);
              }}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
