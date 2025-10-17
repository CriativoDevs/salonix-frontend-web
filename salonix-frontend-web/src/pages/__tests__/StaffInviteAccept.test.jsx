import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { acceptStaffInvite } from '../../api/staff';
import { TextDecoder, TextEncoder } from 'util';

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const StaffInviteAccept = require('../StaffInviteAccept').default;

jest.mock('../../api/staff', () => ({
  acceptStaffInvite: jest.fn(),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(() => ({ tenant: { name: 'Salonix' }, branding: {} })),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const { TextDecoder: Decoder, TextEncoder: Encoder } = require('util');
  if (!global.TextEncoder) {
    global.TextEncoder = Encoder;
    global.TextDecoder = Decoder;
  }
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      let template = key;
      let values = {};
      if (typeof defaultValueOrOptions === 'string') {
        template = defaultValueOrOptions;
      } else if (defaultValueOrOptions && typeof defaultValueOrOptions === 'object') {
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
    },
  }),
}));

describe('StaffInviteAccept page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderWithRouter = (initialEntry = '/staff/accept?token=test-token') =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/staff/accept" element={<StaffInviteAccept />} />
        </Routes>
      </MemoryRouter>
    );

  it('accepts invite and shows success state', async () => {
    acceptStaffInvite.mockResolvedValueOnce({
      staffMember: { first_name: 'Carol' },
      requestId: 'req-accept',
    });

    renderWithRouter();

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'StrongPass!1' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'StrongPass!1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ativar acesso' }));

    await waitFor(() => {
      expect(acceptStaffInvite).toHaveBeenCalledWith({
        token: 'test-token',
        password: 'StrongPass!1',
      });
    });

    expect(await screen.findByText('Convite aceito com sucesso!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para login' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows validation error when token missing', async () => {
    renderWithRouter('/staff/accept');

    fireEvent.change(screen.getByLabelText('Token do convite'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'StrongPass!1' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'StrongPass!1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ativar acesso' }));

    expect(await screen.findByText('Informe o token do convite.')).toBeInTheDocument();
    expect(acceptStaffInvite).not.toHaveBeenCalled();
  });

  it('shows API error when accept fails', async () => {
    acceptStaffInvite.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: 'Convite inválido' },
        headers: { 'x-request-id': 'req-fail' },
      },
    });

    renderWithRouter();

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'StrongPass!1' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'StrongPass!1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ativar acesso' }));

    expect(await screen.findByText('Convite inválido')).toBeInTheDocument();
    expect(screen.getByText(/Request ID/)).toBeInTheDocument();
  });
});
