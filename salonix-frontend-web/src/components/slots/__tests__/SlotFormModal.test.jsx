import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SlotFormModal from '../SlotFormModal';
import { createSlot } from '../../../api/slots';

jest.mock('../../../api/slots', () => ({
  createSlot: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) => {
      if (typeof defaultValueOrOptions === 'string') {
        return defaultValueOrOptions;
      }
      if (
        defaultValueOrOptions &&
        typeof defaultValueOrOptions.defaultValue === 'string'
      ) {
        return defaultValueOrOptions.defaultValue;
      }
      return key;
    },
  }),
}));

const PROFESSIONALS = [{ id: 1, name: 'Alice' }];

describe('SlotFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-07-02T10:00:00'));
    createSlot.mockResolvedValue({ id: 99 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza os campos principais quando aberto', () => {
    render(
      <SlotFormModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    expect(screen.getByText('Criar novo horário')).toBeInTheDocument();
    expect(screen.getByText('Profissional')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('não submete e mostra erro de validação quando profissional não é selecionado', () => {
    render(
      <SlotFormModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Criar slot' }));

    expect(createSlot).not.toHaveBeenCalled();
    expect(
      screen.getByText('Selecione um profissional.')
    ).toBeInTheDocument();
  });

  it('chama createSlot com os dados corretos ao submeter um formulário válido', async () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    render(
      <SlotFormModal
        open={true}
        onClose={onClose}
        onCreated={onCreated}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));

    fireEvent.click(screen.getByRole('button', { name: 'Criar slot' }));

    await waitFor(() => expect(createSlot).toHaveBeenCalledTimes(1));

    expect(createSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalId: '1',
        slug: 'default',
      })
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
