import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InviteStaffModal from '../InviteStaffModal';

jest.mock('../../ui/Modal', () => ({
  __esModule: true,
  default: ({ open, children, footer }) => (open ? <div>{children}{footer}</div> : null),
}));

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

describe('InviteStaffModal', () => {
  it('submits invite and shows success state', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      success: true,
      staffMember: {
        invite_token: 'token-123',
        invite_token_expires_at: '2025-01-10T10:00:00Z',
      },
      requestId: 'req-123',
    });
    const onClose = jest.fn();

    render(
      <InviteStaffModal
        open
        currentUserRole="owner"
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'guest@example.com' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Guest' } });
    fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: 'User' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'guest@example.com',
        role: 'collaborator',
        first_name: 'Guest',
        last_name: 'User',
      });
    });

    expect(await screen.findByText('Convite enviado com sucesso!')).toBeInTheDocument();
    expect(screen.getByText(/token-123/)).toBeInTheDocument();
    expect(screen.getByText(/Token válido/)).toBeInTheDocument();
  });

  it('shows error message when invite fails', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      success: false,
      error: { message: 'Falha ao convidar', requestId: 'req-fail' },
    });

    render(
      <InviteStaffModal
        open
        currentUserRole="manager"
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'guest@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(await screen.findByText('Falha ao convidar')).toBeInTheDocument();
    expect(screen.getByText(/Request ID/)).toBeInTheDocument();
  });
});
