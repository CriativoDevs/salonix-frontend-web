import React from 'react';
import { render, screen } from '@testing-library/react';
import TopServices from '../TopServices';

// Mock do react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
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
    
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
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
});