import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdvancedFilters from '../AdvancedFilters';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('AdvancedFilters', () => {
  it('renderiza apenas o intervalo quando não recebe opções de profissional/serviço', () => {
    render(
      <AdvancedFilters
        interval="day"
        onIntervalChange={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByLabelText('Intervalo de Tempo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Itens por Página')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Profissional')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Serviço')).not.toBeInTheDocument();
  });

  it('renderiza filtros de profissional e serviço com opção "Todos" por padrão', () => {
    const onProfessionalChange = jest.fn();
    const onServiceChange = jest.fn();

    render(
      <AdvancedFilters
        interval="day"
        onIntervalChange={jest.fn()}
        loading={false}
        professionalOptions={[{ value: '1', label: 'Ana Silva' }]}
        professionalId=""
        onProfessionalChange={onProfessionalChange}
        serviceOptions={[{ value: '9', label: 'Corte' }]}
        serviceId=""
        onServiceChange={onServiceChange}
      />
    );

    const professionalSelect = screen.getByLabelText('Profissional');
    const serviceSelect = screen.getByLabelText('Serviço');

    expect(professionalSelect).toHaveValue('');
    expect(
      screen.getByRole('option', { name: 'Todos os profissionais' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Todos os serviços' })
    ).toBeInTheDocument();

    fireEvent.change(professionalSelect, { target: { value: '1' } });
    expect(onProfessionalChange).toHaveBeenCalledWith('1');

    fireEvent.change(serviceSelect, { target: { value: '9' } });
    expect(onServiceChange).toHaveBeenCalledWith('9');
  });
});
