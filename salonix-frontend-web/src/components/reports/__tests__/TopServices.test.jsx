import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TopServices from '../TopServices';

// Mock do react-i18next
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

describe('TopServices', () => {
  const mockData = {
    top_services: [
      { service_id: 1, service_name: 'Corte de Cabelo', qty: 25, revenue: 1250.00 },
      { service_id: 2, service_name: 'Manicure', qty: 18, revenue: 540.00 },
      { service_id: 3, service_name: 'Pedicure', qty: 12, revenue: 360.00 },
    ]
  };

  it('renderiza lista de serviços quando há dados', () => {
    render(<TopServices data={mockData} loading={false} />);
    
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();
    expect(screen.getByText('Pedicure')).toBeInTheDocument();

    const table = within(screen.getByRole('table'));
    expect(table.getByText('25')).toBeInTheDocument();
    expect(table.getByText('18')).toBeInTheDocument();
    expect(table.getByText('12')).toBeInTheDocument();
  });

  it('mostra spinner quando está carregando', () => {
    const { container } = render(<TopServices data={null} loading={true} />);
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('mostra mensagem quando não há dados', () => {
    render(<TopServices data={{ top_services: [] }} loading={false} />);
    
    expect(screen.getByText(/nenhum serviço encontrado/i)).toBeInTheDocument();
  });

  it('mostra mensagem quando data é null', () => {
    render(<TopServices data={null} loading={false} />);
    
    expect(screen.getByText(/nenhum serviço encontrado/i)).toBeInTheDocument();
  });

  it('formata valores monetários corretamente', () => {
    render(<TopServices data={mockData} loading={false} />);

    // O componente usa formatação EUR, então vamos verificar o formato correto
    expect(screen.getByText('€ 1.250,00')).toBeInTheDocument();
    expect(screen.getByText('€ 540,00')).toBeInTheDocument();
    expect(screen.getByText('€ 360,00')).toBeInTheDocument();
  });

  describe('paginação da tabela', () => {
    const manyServices = Array.from({ length: 15 }, (_, i) => ({
      service_id: i + 1,
      service_name: `Serviço ${i + 1}`,
      qty: 15 - i,
      revenue: 100 * (15 - i),
    }));
    const manyData = { top_services: manyServices };

    it('usa PaginationControls com tamanho de página padrão (10)', () => {
      render(<TopServices data={manyData} loading={false} />);

      // Primeira página: 10 linhas de dados + 1 de cabeçalho
      expect(screen.getAllByRole('row')).toHaveLength(11);
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*1\s*–\s*10\s*de\s*15/
      );

      fireEvent.click(screen.getByText('Próximo'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*11\s*–\s*15\s*de\s*15/
      );
      expect(screen.getAllByRole('row')).toHaveLength(6); // 1 header + 5 rows

      expect(screen.getByText('Próximo')).toBeDisabled();

      fireEvent.click(screen.getByText('Anterior'));
      expect(screen.getByText(/Mostrando/)).toHaveTextContent(
        /Mostrando\s*1\s*–\s*10\s*de\s*15/
      );
    });

    it('permite alterar o tamanho de página através do seletor "Itens por página"', () => {
      render(<TopServices data={manyData} loading={false} />);

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '25' },
      });

      expect(screen.getAllByRole('row')).toHaveLength(16); // 1 header + 15 rows
      expect(screen.getByText('Próximo')).toBeDisabled();
    });
  });
});