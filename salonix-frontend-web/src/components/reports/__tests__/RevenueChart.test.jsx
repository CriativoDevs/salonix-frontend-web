import React from 'react';
import { render, screen } from '@testing-library/react';
import RevenueChart from '../RevenueChart';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('RevenueChart', () => {
  const mockData = {
    revenue: {
      series: [
        { period_start: '2024-01-01', revenue: 1200, appointment_count: 10 },
        { period_start: '2024-01-02', revenue: 1500, appointment_count: 12 },
        { period_start: '2024-01-03', revenue: 1800, appointment_count: 15 },
        { period_start: '2024-01-04', revenue: 2100, appointment_count: 18 }
      ]
    }
  };

  it('renderiza tabela quando há dados', () => {
    render(<RevenueChart data={mockData} loading={false} />);
    
    // Verifica se a tabela está presente
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Verifica se os cabeçalhos estão presentes
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos')).toBeInTheDocument();
    expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
  });

  it('mostra spinner quando está carregando', () => {
    const { container } = render(<RevenueChart data={null} loading={true} />);
    
    // Verifica se há elementos de loading
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('mostra mensagem quando não há dados', () => {
    render(<RevenueChart data={null} loading={false} />);
    
    expect(screen.getByText(/nenhum dado de receita encontrado/i)).toBeInTheDocument();
  });

  it('mostra mensagem quando series está vazio', () => {
    const emptyData = { revenue: { series: [] } };
    render(<RevenueChart data={emptyData} loading={false} />);
    
    expect(screen.getByText(/nenhum dado de receita encontrado/i)).toBeInTheDocument();
  });

  it('renderiza estatísticas de receita', () => {
    render(<RevenueChart data={mockData} loading={false} />);
    
    // Verifica se as estatísticas estão presentes
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Média por Período')).toBeInTheDocument();
    expect(screen.getByText('Pico de Receita')).toBeInTheDocument();
  });

  it('formata valores monetários corretamente', () => {
    render(<RevenueChart data={mockData} loading={false} />);
    
    // Verifica se há valores formatados em EUR
    const currencyElements = screen.getAllByText(/€/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });
});