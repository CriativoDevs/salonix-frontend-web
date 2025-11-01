import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DateFilters from '../DateFilters';

// Mock do react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('DateFilters', () => {
  const mockOnFromDateChange = jest.fn();
  const mockOnToDateChange = jest.fn();
  const mockOnApplyFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza campos de data corretamente', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={false} 
      />
    );
    
    expect(screen.getByLabelText(/data inicial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data final/i)).toBeInTheDocument();
  });

  it('mostra valores iniciais nos campos', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={false} 
      />
    );
    
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument();
  });

  it('chama onFromDateChange quando data inicial é alterada', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={false} 
      />
    );
    
    const startDateInput = screen.getByLabelText(/data inicial/i);
    fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
    
    expect(mockOnFromDateChange).toHaveBeenCalledWith('2024-02-01');
  });

  it('chama onToDateChange quando data final é alterada', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={false} 
      />
    );
    
    const endDateInput = screen.getByLabelText(/data final/i);
    fireEvent.change(endDateInput, { target: { value: '2024-02-28' } });
    
    expect(mockOnToDateChange).toHaveBeenCalledWith('2024-02-28');
  });

  it('chama onApplyFilters quando formulário é submetido', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={false} 
      />
    );
    
    const form = screen.getByRole('button', { name: /aplicar filtros/i }).closest('form');
    fireEvent.submit(form);
    
    expect(mockOnApplyFilters).toHaveBeenCalled();
  });

  it('desabilita botão quando está carregando', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={true} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('mostra texto de carregamento quando loading é true', () => {
    render(
      <DateFilters 
        fromDate="2024-01-01"
        toDate="2024-01-31"
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onApplyFilters={mockOnApplyFilters}
        loading={true} 
      />
    );
    
    expect(screen.getByText(/aplicando/i)).toBeInTheDocument();
  });
});