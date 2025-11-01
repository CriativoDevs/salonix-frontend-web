import React from 'react';
import { render, screen } from '@testing-library/react';
import TopServices from '../TopServices';
import RevenueChart from '../RevenueChart';
import DateFilters from '../DateFilters';
import ExportButton from '../ExportButton';

// Mock do react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock da API
jest.mock('../../../api/reports', () => ({
  exportBasicReportsCSV: jest.fn(),
}));

describe('Error and Loading States', () => {
  describe('TopServices Error States', () => {
    it('mostra spinner durante loading', () => {
      render(<TopServices data={null} loading={true} />);
      // Verificar se há elementos com classe de loading
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('mostra mensagem quando não há dados (array vazio)', () => {
      render(<TopServices data={{ top_services: [] }} loading={false} />);
      expect(screen.getByText('Nenhum serviço encontrado no período selecionado')).toBeInTheDocument();
    });

    it('mostra mensagem quando dados são null', () => {
      render(<TopServices data={null} loading={false} />);
      expect(screen.getByText('Nenhum serviço encontrado no período selecionado')).toBeInTheDocument();
    });

    it('não mostra spinner quando não está loading', () => {
      render(<TopServices data={{ top_services: [] }} loading={false} />);
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(0);
    });
  });

  describe('RevenueChart Error States', () => {
    it('mostra spinner durante loading', () => {
      render(<RevenueChart data={null} loading={true} />);
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('exibe mensagem quando não há dados', () => {
      render(<RevenueChart data={null} loading={false} />);
      expect(screen.getByText('Nenhum dado de receita encontrado no período selecionado')).toBeInTheDocument();
    });

    it('renderiza tabela quando há dados válidos', () => {
      const validData = {
        revenue: {
          series: [
            { period_start: '2024-01-01', revenue: 1000, appointment_count: 5 },
            { period_start: '2024-01-02', revenue: 1500, appointment_count: 8 },
            { period_start: '2024-01-03', revenue: 1200, appointment_count: 6 }
          ]
        }
      };
      render(<RevenueChart data={validData} loading={false} />);
      expect(screen.queryByText('Nenhum dado de receita encontrado no período selecionado')).not.toBeInTheDocument();
    });
  });

  describe('DateFilters Loading State', () => {
    it('desabilita botão durante loading', () => {
      render(
        <DateFilters 
          fromDate="2024-01-01"
          toDate="2024-01-31"
          onFromDateChange={() => {}}
          onToDateChange={() => {}}
          onApplyFilters={() => {}}
          loading={true}
        />
      );
      
      const applyButton = screen.getByRole('button');
      expect(applyButton).toBeDisabled();
      expect(screen.getByText('Aplicando...')).toBeInTheDocument();
    });

    it('habilita botão quando não está loading', () => {
      render(
        <DateFilters 
          fromDate="2024-01-01"
          toDate="2024-01-31"
          onFromDateChange={() => {}}
          onToDateChange={() => {}}
          onApplyFilters={() => {}}
          loading={false}
        />
      );
      
      const applyButton = screen.getByRole('button');
      expect(applyButton).not.toBeDisabled();
      expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
    });

    it('campos de data estão sempre habilitados', () => {
      render(
        <DateFilters 
          fromDate="2024-01-01"
          toDate="2024-01-31"
          onFromDateChange={() => {}}
          onToDateChange={() => {}}
          onApplyFilters={() => {}}
          loading={true}
        />
      );
      
      const fromDateInput = screen.getByLabelText('Data inicial');
      const toDateInput = screen.getByLabelText('Data final');
      
      expect(fromDateInput).not.toBeDisabled();
      expect(toDateInput).not.toBeDisabled();
    });
  });

  describe('ExportButton Error States', () => {
    it('desabilita botão quando disabled prop é true', () => {
      render(<ExportButton filters={{}} disabled={true} />);
      const button = screen.getByRole('link');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    });

    it('habilita botão quando disabled prop é false', () => {
      render(<ExportButton filters={{}} disabled={false} />);
      const button = screen.getByRole('link');
      expect(button).not.toHaveClass('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    });

    it('mostra texto correto baseado na tradução', () => {
      render(<ExportButton filters={{}} disabled={false} />);
      expect(screen.getByText('reports.export.csv')).toBeInTheDocument();
    });
  });

  describe('Combinação de Estados', () => {
    it('todos os componentes respondem corretamente ao loading simultâneo', () => {
      render(
        <div>
          <TopServices data={null} loading={true} />
          <RevenueChart data={null} loading={true} />
          <DateFilters 
            fromDate=""
            toDate=""
            onFromDateChange={() => {}}
            onToDateChange={() => {}}
            onApplyFilters={() => {}}
            loading={true}
          />
          <ExportButton filters={{}} disabled={true} />
        </div>
      );
      
      // Verificar que há elementos de loading
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
      
      // Verificar que botão de aplicar está desabilitado
      const applyButton = screen.getByRole('button');
      expect(applyButton).toBeDisabled();
      
      // Verificar que botão de export está desabilitado
      const exportButton = screen.getByRole('link');
      expect(exportButton).toHaveClass('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    });
  });
});