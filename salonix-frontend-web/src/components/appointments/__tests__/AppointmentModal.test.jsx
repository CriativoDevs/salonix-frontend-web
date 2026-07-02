import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppointmentModal from '../AppointmentModal';
import { createAppointment } from '../../../api/appointments';
import { fetchSlots } from '../../../api/slots';

jest.mock('../../../api/appointments', () => ({
  createAppointment: jest.fn(),
}));

jest.mock('../../../api/slots', () => ({
  fetchSlots: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
  }),
}));

const CUSTOMERS = [{ id: 1, name: 'Ana Cliente' }];
const SERVICES = [{ id: 1, name: 'Corte', duration_minutes: 30 }];
const PROFESSIONALS = [{ id: 1, name: 'Alice' }];
const SLOTS = [
  { id: 101, start_time: '2026-07-02T11:00:00Z', end_time: '2026-07-02T11:45:00Z' },
  { id: 102, start_time: '2026-07-02T14:00:00Z', end_time: '2026-07-02T14:45:00Z' },
];

// Formata igual ao componente, para não depender do timezone do ambiente de teste.
function expectedSlotTime(slot) {
  return new Date(slot.start_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// O Dropdown pesquisável agenda um foco assíncrono (50ms) ao abrir; esperamos
// a caixa de pesquisa aparecer antes de escolher um item, para não fechar o
// dropdown (e limpar a ref) antes desse timer dispara.
async function selectFromDropdown(triggerName, itemName) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(triggerName, 'i') }));
  await screen.findByPlaceholderText('Pesquisar...');
  // Deixa o setTimeout(50ms) de foco do Dropdown correr enquanto ainda está montado.
  await new Promise((resolve) => setTimeout(resolve, 60));
  fireEvent.click(screen.getByRole('button', { name: itemName }));
}

describe('AppointmentModal - seletor de horário baseado em slots disponíveis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSlots.mockResolvedValue(SLOTS);
    createAppointment.mockResolvedValue({ id: 1 });
  });

  it('não mostra mais os campos livres de Início/Término', () => {
    render(
      <AppointmentModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        customers={CUSTOMERS}
        services={SERVICES}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    expect(screen.queryByLabelText(/início/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/término/i)).not.toBeInTheDocument();
  });

  it('mantém o seletor de Horário desativado até um profissional ser escolhido', () => {
    render(
      <AppointmentModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        customers={CUSTOMERS}
        services={SERVICES}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    const horarioTrigger = screen.getByRole('button', { name: /selecione um horário/i });
    expect(horarioTrigger).toBeDisabled();
    expect(fetchSlots).not.toHaveBeenCalled();
  });

  it('busca os horários disponíveis do profissional escolhido e lista-os', async () => {
    render(
      <AppointmentModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        customers={CUSTOMERS}
        services={SERVICES}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    await selectFromDropdown('selecione um profissional', 'Alice');

    await waitFor(() =>
      expect(fetchSlots).toHaveBeenCalledWith({ professionalId: '1', slug: 'default' })
    );

    const horarioTrigger = await screen.findByRole('button', { name: /selecione um horário/i });
    expect(horarioTrigger).toBeEnabled();

    fireEvent.click(horarioTrigger);
    await screen.findByPlaceholderText('Pesquisar...');
    expect(
      screen.getByRole('button', { name: new RegExp(expectedSlotTime(SLOTS[0])) })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(expectedSlotTime(SLOTS[1])) })
    ).toBeInTheDocument();
    // Deixa o setTimeout(50ms) de foco do Dropdown correr antes de desmontar.
    await new Promise((resolve) => setTimeout(resolve, 60));
  });

  it('mostra aviso quando o profissional não tem horários disponíveis', async () => {
    fetchSlots.mockResolvedValue([]);
    render(
      <AppointmentModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        customers={CUSTOMERS}
        services={SERVICES}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    await selectFromDropdown('selecione um profissional', 'Alice');

    expect(
      await screen.findByText(/sem horários disponíveis/i)
    ).toBeInTheDocument();
  });

  it('envia o agendamento com o slot escolhido, sem start_time/end_time manuais', async () => {
    render(
      <AppointmentModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        customers={CUSTOMERS}
        services={SERVICES}
        professionals={PROFESSIONALS}
        slug="default"
      />
    );

    await selectFromDropdown('selecione um cliente', 'Ana Cliente');
    await selectFromDropdown('selecione um serviço', /corte/i);
    await selectFromDropdown('selecione um profissional', 'Alice');

    const horarioTrigger = await screen.findByRole('button', {
      name: /selecione um horário/i,
    });
    await waitFor(() => expect(horarioTrigger).toBeEnabled());
    fireEvent.click(horarioTrigger);
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(expectedSlotTime(SLOTS[0])) })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Agendar' }));

    await waitFor(() => expect(createAppointment).toHaveBeenCalled());
    const [payload] = createAppointment.mock.calls[0];
    expect(payload).toMatchObject({
      customer: 1,
      service: 1,
      professional: 1,
      slot: 101,
    });
    expect(payload.start_time).toBeUndefined();
    expect(payload.end_time).toBeUndefined();
  });
});
