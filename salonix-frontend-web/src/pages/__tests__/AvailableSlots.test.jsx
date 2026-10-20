import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AvailableSlots from '../AvailableSlots';
import { useTenant } from '../../hooks/useTenant';
import { fetchProfessionals } from '../../api/professionals';
import {
  fetchSlotsWithMeta,
  deleteSlot,
  blockSlot,
  unblockSlot,
} from '../../api/slots';
import { fetchTenantBusinessHours } from '../../api/tenant';

const tMock = (key, defaultValueOrOptions, maybeOptions) => {
  let template = key;
  let values = {};

  if (typeof defaultValueOrOptions === 'string') {
    template = defaultValueOrOptions;
  } else if (
    defaultValueOrOptions &&
    typeof defaultValueOrOptions === 'object'
  ) {
    if (typeof defaultValueOrOptions.defaultValue === 'string') {
      template = defaultValueOrOptions.defaultValue;
    }
    values = defaultValueOrOptions;
  }

  if (maybeOptions && typeof maybeOptions === 'object') {
    if (typeof maybeOptions.defaultValue === 'string') {
      template = maybeOptions.defaultValue;
    }
    values = { ...values, ...maybeOptions };
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : ''
  );
};

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../api/professionals', () => ({
  fetchProfessionals: jest.fn(),
}));

jest.mock('../../api/slots', () => ({
  fetchSlotsWithMeta: jest.fn(),
  deleteSlot: jest.fn(),
  blockSlot: jest.fn(),
  unblockSlot: jest.fn(),
}));

jest.mock('../../api/tenant', () => ({
  fetchTenantBusinessHours: jest.fn(),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
    i18n: { language: 'pt' },
  }),
}));

const PROFESSIONALS = [{ id: 1, name: 'Alice' }];

const AVAILABLE_SLOT = {
  id: 10,
  professional: 1,
  start_time: '2026-07-02 09:00',
  end_time: '2026-07-02 10:00',
  status: 'available',
};

const BLOCKED_SLOT = {
  id: 11,
  professional: 1,
  start_time: '2026-07-02 11:00',
  end_time: '2026-07-02 12:00',
  status: 'blocked',
  blocked_reason: 'Manutenção',
};

const BOOKED_SLOT = {
  id: 12,
  professional: 1,
  start_time: '2026-07-02 14:00',
  end_time: '2026-07-02 15:00',
  status: 'booked',
};

function mockSlots(items) {
  fetchSlotsWithMeta.mockResolvedValue({
    results: items,
    count: items.length,
    meta: { totalCount: items.length },
  });
}

describe('AvailableSlots page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.prompt = jest.fn(() => '');
    useTenant.mockReturnValue({ slug: 'default' });
    fetchProfessionals.mockResolvedValue(PROFESSIONALS);
    fetchTenantBusinessHours.mockResolvedValue([
      { is_active: true, day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00' },
    ]);
    deleteSlot.mockResolvedValue(true);
    blockSlot.mockResolvedValue({ ...AVAILABLE_SLOT, status: 'blocked' });
    unblockSlot.mockResolvedValue({ ...BLOCKED_SLOT, status: 'available' });
  });

  it('abre o modal de criação ao clicar em "Novo horário"', async () => {
    mockSlots([AVAILABLE_SLOT]);
    render(<AvailableSlots />);

    await waitFor(() =>
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /Novo horário/i }));

    expect(screen.getByText('Criar novo horário')).toBeInTheDocument();
  });

  it('chama blockSlot ao bloquear um horário disponível e atualiza a UI', async () => {
    mockSlots([AVAILABLE_SLOT]);
    render(<AvailableSlots />);

    await waitFor(() =>
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument()
    );

    mockSlots([{ ...AVAILABLE_SLOT, status: 'blocked' }]);

    fireEvent.click(screen.getByRole('button', { name: /Bloquear/i }));

    await waitFor(() => expect(blockSlot).toHaveBeenCalledWith(10, {
      reason: '',
      slug: 'default',
    }));

    await waitFor(() =>
      expect(screen.getByText('Bloqueado')).toBeInTheDocument()
    );
  });

  it('chama unblockSlot ao desbloquear um horário bloqueado', async () => {
    mockSlots([BLOCKED_SLOT]);
    render(<AvailableSlots />);

    await waitFor(() =>
      expect(screen.getByText(/11:00 - 12:00/)).toBeInTheDocument()
    );

    mockSlots([{ ...BLOCKED_SLOT, status: 'available' }]);

    fireEvent.click(screen.getByRole('button', { name: /Desbloquear/i }));

    await waitFor(() =>
      expect(unblockSlot).toHaveBeenCalledWith(11, { slug: 'default' })
    );
  });

  it('não exibe ação de bloquear para um horário reservado', async () => {
    mockSlots([BOOKED_SLOT]);
    render(<AvailableSlots />);

    await waitFor(() =>
      expect(screen.getByText(/14:00 - 15:00/)).toBeInTheDocument()
    );

    expect(
      screen.queryByRole('button', { name: /Bloquear/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Desbloquear/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Reservado')).toBeInTheDocument();
  });

  it('filtra por status ao selecionar no painel de filtros', async () => {
    mockSlots([AVAILABLE_SLOT]);
    render(<AvailableSlots />);

    await waitFor(() =>
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /^Filtros$/i }));

    const statusSelect = screen
      .getAllByRole('combobox')
      .find((el) =>
        Array.from(el.options).some((opt) => opt.value === 'blocked')
      );
    fireEvent.change(statusSelect, { target: { value: 'blocked' } });

    await waitFor(() =>
      expect(fetchSlotsWithMeta).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ status: 'blocked' }),
        })
      )
    );
  });
});
