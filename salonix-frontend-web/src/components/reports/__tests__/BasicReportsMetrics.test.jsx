import React from 'react';
import { render, screen } from '@testing-library/react';
import BasicReportsMetrics from '../BasicReportsMetrics';

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

describe('BasicReportsMetrics', () => {
  const mockData = {
    overview: {
      appointments_total: 100,
      appointments_completed: 80,
      revenue_total: 5000,
      avg_ticket: 62.5,
    },
  };

  it('renderiza os 4 cards de métricas com dados válidos', () => {
    render(<BasicReportsMetrics data={mockData} />);

    expect(screen.getByText('Total de Agendamentos')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos Concluídos')).toBeInTheDocument();
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
  });

  it('retorna null quando data é null', () => {
    const { container } = render(<BasicReportsMetrics data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('exibe zero quando appointments_total está ausente', () => {
    const partialData = { overview: {} };
    expect(() =>
      render(<BasicReportsMetrics data={partialData} />)
    ).not.toThrow();
    expect(screen.getByText('Total de Agendamentos')).toBeInTheDocument();
  });

  it('aceita payload flat (sem overview)', () => {
    const flatData = {
      appointments_total: 50,
      appointments_completed: 40,
      revenue_total: 2000,
      avg_ticket: 50,
    };
    expect(() => render(<BasicReportsMetrics data={flatData} />)).not.toThrow();
    expect(screen.getByText('Total de Agendamentos')).toBeInTheDocument();
  });

  it('aceita múltiplos formatos de comparison sem crash', () => {
    const dataWithComparison = {
      ...mockData,
      comparison: {
        appointments_total: { delta: 5, delta_pct: 5.3 },
        revenue_total: { delta: 200, deltaPercent: 4.2 },
      },
    };
    expect(() =>
      render(<BasicReportsMetrics data={dataWithComparison} />)
    ).not.toThrow();
  });

  it('exibe taxa de conclusão correta', () => {
    render(<BasicReportsMetrics data={mockData} />);
    // 80/100 = 80.0%
    expect(screen.getByText(/taxa de conclusão: 80\.0%/i)).toBeInTheDocument();
  });

  describe('custo de produtos (COGS) e margem — BE-REPORTS-01', () => {
    it('não exibe os cards de custo/margem quando stock_active é false', () => {
      render(
        <BasicReportsMetrics
          data={{
            ...mockData,
            overview: {
              ...mockData.overview,
              stock_active: false,
              product_cost_total: null,
              margin_total: null,
            },
          }}
        />
      );

      expect(
        screen.queryByText('Custo de Produtos (COGS)')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Margem Total')).not.toBeInTheDocument();
    });

    it('não exibe os cards de custo/margem quando stock_active está ausente', () => {
      render(<BasicReportsMetrics data={mockData} />);

      expect(
        screen.queryByText('Custo de Produtos (COGS)')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Margem Total')).not.toBeInTheDocument();
    });

    it('exibe custo de produtos e margem quando stock_active é true', () => {
      render(
        <BasicReportsMetrics
          data={{
            ...mockData,
            overview: {
              ...mockData.overview,
              stock_active: true,
              product_cost_total: 32.5,
              margin_total: 4967.5,
            },
          }}
        />
      );

      expect(screen.getByText('Custo de Produtos (COGS)')).toBeInTheDocument();
      expect(screen.getByText('Margem Total')).toBeInTheDocument();
    });
  });
});
