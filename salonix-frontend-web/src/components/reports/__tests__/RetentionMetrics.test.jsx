import React from 'react';
import { render, screen } from '@testing-library/react';
import RetentionMetrics from '../RetentionMetrics';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, opts) => {
      if (opts)
        return defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k) => opts[k] ?? '');
      return defaultValue || key;
    },
  }),
}));

jest.mock('../../../utils/format', () => ({
  formatCurrency: (v) => `€ ${Number(v || 0).toFixed(2)}`,
  formatPercent: (v) => `${(v * 100).toFixed(1)}%`,
}));

describe('RetentionMetrics', () => {
  const mockData = {
    new_clients: { qty: 20, revenue: 800 },
    returning_clients: { qty: 80, revenue: 3200 },
  };

  it('renderiza taxa de retenção quando há dados', () => {
    render(<RetentionMetrics data={mockData} />);

    expect(screen.getByText('Taxa de Retenção')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('renderiza cartões de Novos e Recorrentes', () => {
    render(<RetentionMetrics data={mockData} />);

    expect(screen.getByText('Novos Clientes')).toBeInTheDocument();
    expect(screen.getByText('Clientes Recorrentes')).toBeInTheDocument();
  });

  it('mostra empty state com ícone quando data é null', () => {
    const { container } = render(<RetentionMetrics data={null} />);

    expect(
      screen.getByText('Nenhum dado disponível para o período selecionado.')
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('não quebra com new_clients ausente (payload parcial)', () => {
    const partialData = { returning_clients: { qty: 10, revenue: 400 } };
    expect(() => render(<RetentionMetrics data={partialData} />)).not.toThrow();
  });

  it('não quebra com returning_clients ausente (payload parcial)', () => {
    const partialData = { new_clients: { qty: 5, revenue: 100 } };
    expect(() => render(<RetentionMetrics data={partialData} />)).not.toThrow();
  });

  it('exibe 0.0% de retenção quando só há clientes novos', () => {
    const onlyNewClients = {
      new_clients: { qty: 10, revenue: 500 },
      returning_clients: { qty: 0, revenue: 0 },
    };
    render(<RetentionMetrics data={onlyNewClients} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
