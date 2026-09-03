import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import RevenueChart from '../RevenueChart';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      let template = key;
      let values = {};
      if (typeof defaultValueOrOptions === 'string') {
        template = defaultValueOrOptions;
      } else if (
        defaultValueOrOptions &&
        typeof defaultValueOrOptions === 'object'
      ) {
        values = defaultValueOrOptions;
      }
      if (maybeOptions && typeof maybeOptions === 'object') {
        values = { ...values, ...maybeOptions };
      }
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        Object.prototype.hasOwnProperty.call(values, token)
          ? values[token]
          : ''
      );
    },
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

    // A visualização padrão é o gráfico; alternar para a tabela
    fireEvent.click(screen.getByText('Tabela'));

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

  describe('paginação da tabela', () => {
    const manySeries = Array.from({ length: 25 }, (_, i) => ({
      period_start: `2024-01-${String(i + 1).padStart(2, '0')}`,
      revenue: 100 * (i + 1),
      appointment_count: i + 1,
    }));
    const manyData = { revenue: { series: manySeries } };

    it('mostra os controles de paginação (PaginationControls) mesmo quando cabe tudo numa página', () => {
      render(<RevenueChart data={mockData} loading={false} />);
      fireEvent.click(screen.getByText('Tabela'));

      // PaginationControls é sempre renderizado quando há dados; os links
      // Anterior/Próximo ficam desabilitados quando não há mais páginas.
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Próximo')).toBeInTheDocument();
      expect(screen.getByText('Anterior')).toBeDisabled();
      expect(screen.getByText('Próximo')).toBeDisabled();
    });

    it('pagina os períodos exibidos na tabela respeitando o tamanho de página padrão (10)', () => {
      render(<RevenueChart data={manyData} loading={false} />);
      fireEvent.click(screen.getByText('Tabela'));

      // Primeira página: 10 linhas
      expect(screen.getAllByRole('row')).toHaveLength(11); // 1 header + 10 rows
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*1\s*–\s*10\s*de\s*25/
      );

      fireEvent.click(screen.getByText('Próximo'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*11\s*–\s*20\s*de\s*25/
      );

      fireEvent.click(screen.getByText('Próximo'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*21\s*–\s*25\s*de\s*25/
      );
      expect(screen.getAllByRole('row')).toHaveLength(6); // 1 header + 5 rows (25 - 20)

      // Link "Próximo" desabilitado na última página
      expect(screen.getByText('Próximo')).toBeDisabled();

      fireEvent.click(screen.getByText('Anterior'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*11\s*–\s*20\s*de\s*25/
      );
    });

    it('permite alterar o tamanho de página através do seletor "Itens por página"', () => {
      render(<RevenueChart data={manyData} loading={false} />);
      fireEvent.click(screen.getByText('Tabela'));

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '25' },
      });

      expect(screen.getAllByRole('row')).toHaveLength(26); // 1 header + 25 rows
      expect(screen.getByText('Próximo')).toBeDisabled();
    });

    it('reinicia para o início quando os dados mudam', () => {
      const { rerender } = render(
        <RevenueChart data={manyData} loading={false} />
      );
      fireEvent.click(screen.getByText('Tabela'));
      fireEvent.click(screen.getByText('Próximo'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*11\s*–\s*20\s*de\s*25/
      );

      const otherData = {
        revenue: { series: manySeries.slice(0, 5) },
      };
      rerender(<RevenueChart data={otherData} loading={false} />);

      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*1\s*–\s*5\s*de\s*5/
      );
    });
  });
});