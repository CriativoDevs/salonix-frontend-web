import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, PackageSearch } from 'lucide-react';

export default function InventoryReportMetrics({ data }) {
  const { t, i18n } = useTranslation();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language || 'pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat(i18n.language || 'pt-BR').format(value || 0);
  };

  const formatRate = (value) => {
    if (value === null || value === undefined) {
      return t('reports.inventory.turnover.not_applicable', 'N/D');
    }
    return new Intl.NumberFormat(i18n.language || 'pt-BR', {
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!data) {
    return null;
  }

  const stockActive = Boolean(data.stock_active);

  if (!stockActive) {
    return (
      <div className="rounded-lg border border-brand-border bg-brand-light/40 p-6">
        <div className="flex items-start gap-3">
          <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
          <div>
            <p className="text-sm font-medium text-brand-surfaceForeground">
              {t(
                'reports.inventory.empty_title',
                'Ainda sem dados de estoque'
              )}
            </p>
            <p className="mt-1 text-sm text-brand-surfaceForeground/70">
              {t(
                'reports.inventory.empty_description',
                'Este relatório fica disponível assim que você cadastrar o primeiro item no módulo de Estoque.'
              )}
            </p>
            <Link
              to="/inventory"
              className="mt-3 inline-flex items-center rounded-md border border-brand-border px-3 py-1.5 text-sm text-brand-surfaceForeground hover:bg-brand-surface"
            >
              {t('reports.inventory.go_to_inventory', 'Ir para o Estoque')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalStockValue = Number(data.total_stock_value) || 0;
  const lowStockCount = Number(data.low_stock_items_count) || 0;
  const lowStockItems = Array.isArray(data.low_stock_items)
    ? data.low_stock_items
    : [];
  const turnover = Array.isArray(data.turnover) ? data.turnover : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-brand-surfaceForeground/60">
            {t('reports.inventory.total_value', 'Valor Total em Estoque')}
          </p>
          <p className="mt-2 text-2xl font-semibold leading-tight text-brand-surfaceForeground">
            {formatCurrency(totalStockValue)}
          </p>
          <p className="mt-2 text-xs text-brand-surfaceForeground/60">
            {t(
              'reports.inventory.total_value_detail',
              'Valoração ao custo (quantidade × custo unitário)'
            )}
          </p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-brand-surfaceForeground/60">
            {t('reports.inventory.low_stock_count', 'Itens com Estoque Baixo')}
          </p>
          <p className="mt-2 text-2xl font-semibold leading-tight text-brand-surfaceForeground">
            {formatNumber(lowStockCount)}
          </p>
          <p className="mt-2 text-xs text-brand-surfaceForeground/60">
            {t(
              'reports.inventory.low_stock_count_detail',
              'Itens na quantidade mínima ou abaixo dela'
            )}
          </p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 shadow-sm ring-1 ring-amber-400/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-amber-800">
                {t('reports.inventory.low_stock_list.title', 'Itens a repor')}
              </h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <li
                    key={item.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                  >
                    {item.name}
                    <span className="text-amber-700/70">
                      ({formatNumber(item.quantity)} /{' '}
                      {formatNumber(item.minimum_quantity)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
        <h4 className="text-sm font-medium text-brand-surfaceForeground">
          {t('reports.inventory.turnover.title', 'Giro de Estoque no Período')}
        </h4>
        <p className="mt-1 text-xs text-brand-surfaceForeground/60">
          {t(
            'reports.inventory.turnover.description',
            'Quantidade consumida em relação à quantidade atual de cada item'
          )}
        </p>

        {turnover.length === 0 ? (
          <p className="mt-4 text-sm text-brand-surfaceForeground/60">
            {t(
              'reports.inventory.turnover.empty',
              'Nenhuma movimentação de saída registrada no período selecionado.'
            )}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-border text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                  <th className="py-2 pr-4">
                    {t('reports.inventory.turnover.item', 'Item')}
                  </th>
                  <th className="py-2 pr-4">
                    {t(
                      'reports.inventory.turnover.quantity_out',
                      'Saídas no Período'
                    )}
                  </th>
                  <th className="py-2 pr-4">
                    {t(
                      'reports.inventory.turnover.current_quantity',
                      'Quantidade Atual'
                    )}
                  </th>
                  <th className="py-2 pr-4">
                    {t(
                      'reports.inventory.turnover.turnover_rate',
                      'Taxa de Giro'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {turnover.map((row) => (
                  <tr key={row.item_id}>
                    <td className="py-2 pr-4 text-brand-surfaceForeground">
                      {row.item_name}
                    </td>
                    <td className="py-2 pr-4 text-brand-surfaceForeground/80">
                      {formatNumber(row.quantity_out)}
                    </td>
                    <td className="py-2 pr-4 text-brand-surfaceForeground/80">
                      {formatNumber(row.current_quantity)}
                    </td>
                    <td className="py-2 pr-4 text-brand-surfaceForeground/80">
                      {formatRate(row.turnover_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
