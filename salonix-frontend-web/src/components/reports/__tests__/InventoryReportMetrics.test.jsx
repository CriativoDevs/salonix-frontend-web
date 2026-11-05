import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InventoryReportMetrics from '../InventoryReportMetrics';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, opts) => {
      if (opts)
        return defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k) => opts[k] ?? '');
      return defaultValue || key;
    },
    i18n: { language: 'pt-BR' },
  }),
}));

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('InventoryReportMetrics', () => {
  it('retorna null quando data é null', () => {
    const { container } = renderWithRouter(
      <InventoryReportMetrics data={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('exibe estado vazio (nunca erro) quando stock_active é false', () => {
    renderWithRouter(
      <InventoryReportMetrics
        data={{
          stock_active: false,
          total_stock_value: 0,
          low_stock_items_count: 0,
          low_stock_items: [],
          turnover: [],
          period: { start: '2026-11-01', end: '2026-11-05' },
        }}
      />
    );

    expect(screen.getByText('Ainda sem dados de estoque')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ir para o Estoque' })
    ).toHaveAttribute('href', '/inventory');

    // Não deve tentar renderizar métricas de valor/giro.
    expect(
      screen.queryByText('Valor Total em Estoque')
    ).not.toBeInTheDocument();
  });

  it('exibe valor total, itens em alerta e giro quando stock_active é true', () => {
    renderWithRouter(
      <InventoryReportMetrics
        data={{
          stock_active: true,
          total_stock_value: 480,
          low_stock_items_count: 1,
          low_stock_items: [
            { id: 1, name: 'Shampoo', quantity: 2, minimum_quantity: 5 },
          ],
          turnover: [
            {
              item_id: 1,
              item_name: 'Shampoo',
              quantity_out: 10,
              current_quantity: 2,
              turnover_rate: 5,
            },
            {
              item_id: 2,
              item_name: 'Toalha',
              quantity_out: 0,
              current_quantity: 0,
              turnover_rate: null,
            },
          ],
          period: { start: '2026-11-01', end: '2026-11-05' },
        }}
      />
    );

    expect(screen.getByText('Valor Total em Estoque')).toBeInTheDocument();
    expect(screen.getByText('Itens com Estoque Baixo')).toBeInTheDocument();
    expect(screen.getAllByText(/Shampoo/).length).toBeGreaterThan(0);
    expect(screen.getByText('Toalha')).toBeInTheDocument();
    // turnover_rate null -> "N/D"
    expect(screen.getByText('N/D')).toBeInTheDocument();
  });

  it('exibe estado vazio do giro quando não há movimentação no período', () => {
    renderWithRouter(
      <InventoryReportMetrics
        data={{
          stock_active: true,
          total_stock_value: 100,
          low_stock_items_count: 0,
          low_stock_items: [],
          turnover: [],
          period: { start: '2026-11-01', end: '2026-11-05' },
        }}
      />
    );

    expect(
      screen.getByText(
        'Nenhuma movimentação de saída registrada no período selecionado.'
      )
    ).toBeInTheDocument();
  });
});
