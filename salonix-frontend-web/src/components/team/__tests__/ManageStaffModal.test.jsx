import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageStaffModal from '../ManageStaffModal';

jest.mock('../../ui/Modal', () => ({
  __esModule: true,
  default: ({ open, children, footer }) =>
    open ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null,
}));

jest.mock('../../../api/staff', () => ({
  __esModule: true,
  resendStaffInvite: jest.fn().mockResolvedValue({
    staffMember: {
      invite_token: 'tok-xyz',
      invite_token_expires_at: '2025-02-10T10:00:00Z',
    },
    requestId: 'req-resend-1',
  }),
  sendStaffAccessLink: jest.fn().mockResolvedValue({
    staffMember: { id: 3, status: 'active' },
    requestId: 'req-access-1',
  }),
}));

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

describe('ManageStaffModal', () => {
  const baseMember = {
    id: 3,
    role: 'collaborator',
    status: 'active',
    email: 'carol@example.com',
    first_name: 'Carol',
    last_name: 'Collab',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves role changes', async () => {
    const onUpdate = jest
      .fn()
      .mockResolvedValue({ success: true, requestId: 'req-1' });

    render(
      <ManageStaffModal
        open
        member={baseMember}
        onClose={jest.fn()}
        onUpdate={onUpdate}
        professionals={[]}
        currentUserRole="owner"
      />
    );

    // Switch to permissions tab first
    fireEvent.click(screen.getByRole('button', { name: 'Permissões' }));

    // Select manager role using radio button - use userEvent for better simulation
    const managerRadio = screen.getByDisplayValue('manager');
    fireEvent.click(managerRadio);

    // Verify the radio is selected
    expect(managerRadio).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar papel' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(3, { role: 'manager' });
    });
  });

  it('updates status to disabled with confirmation', async () => {
    const onUpdate = jest
      .fn()
      .mockResolvedValue({ success: true, requestId: 'req-2' });
    const confirmSpy = jest
      .spyOn(window, 'confirm')
      .mockImplementation(() => true);

    render(
      <ManageStaffModal
        open
        member={baseMember}
        currentUserRole="owner"
        onClose={jest.fn()}
        onUpdate={onUpdate}
      />
    );

    // Switch to permissions tab first
    fireEvent.click(screen.getByRole('button', { name: 'Permissões' }));

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(3, { status: 'disabled' });
    });

    confirmSpy.mockRestore();
  });

  it('shows access link for active status and triggers API', async () => {
    const { sendStaffAccessLink } = await import('../../../api/staff');

    const activeMember = { ...baseMember, status: 'active' };

    render(
      <ManageStaffModal
        open
        member={activeMember}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        currentUserRole="manager"
        professionals={[
          { id: 10, name: 'Carol Pro', staff_member: activeMember.id },
        ]}
        canManageProfessional={() => true}
        onProfessionalCreate={jest.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: 'Enviar link de acesso' });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(sendStaffAccessLink).toHaveBeenCalled();
    });

    expect(
      await screen.findByText('Link de acesso enviado com sucesso.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Request ID/)).toBeInTheDocument();
  });

  it('shows tip when active without email and hides access button', async () => {
    const memberNoEmail = { ...baseMember, status: 'active', email: '' };

    render(
      <ManageStaffModal
        open
        member={memberNoEmail}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        currentUserRole="manager"
        professionals={[
          { id: 11, name: 'Pro', staff_member: memberNoEmail.id },
        ]}
        canManageProfessional={() => true}
        onProfessionalCreate={jest.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Enviar link de acesso' })
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('Informe o e-mail do membro para enviar link de acesso.')
    ).toBeInTheDocument();
  });

  it('shows resend invite for non-active member and triggers API', async () => {
    const { resendStaffInvite } = await import('../../../api/staff');

    const invitedMember = { ...baseMember, status: 'invited' };

    render(
      <ManageStaffModal
        open
        member={invitedMember}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        currentUserRole="owner"
        professionals={[
          { id: 12, name: 'Pro', staff_member: invitedMember.id },
        ]}
        canManageProfessional={() => true}
        onProfessionalCreate={jest.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: 'Reenviar convite' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(resendStaffInvite).toHaveBeenCalled();
    });
  });

  it('alerts when trying to clear access email and blocks save', async () => {
    const onProfessionalUpdate = jest.fn();

    render(
      <ManageStaffModal
        open
        member={baseMember}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        professionals={[{ id: 21, name: 'Pro', staff_member: baseMember.id }]}
        onProfessionalUpdate={onProfessionalUpdate}
        canManageProfessional={() => true}
        currentUserRole="owner"
      />
    );

    // Entrar em edição de profissional
    const editButton = screen.getByRole('button', {
      name: 'Editar Profissional',
    });
    fireEvent.click(editButton);

    // Limpar o e-mail de acesso
    const emailInput = screen.getByLabelText('E-mail de acesso');
    fireEvent.change(emailInput, { target: { value: '' } });

    // Tentar salvar
    const saveButton = screen.getByRole('button', {
      name: 'Salvar profissional',
    });
    fireEvent.click(saveButton);

    // Deve mostrar alerta e não chamar atualização
    expect(
      await screen.findByText(
        'E-mail de acesso não pode ser apagado. Informe um e-mail válido.'
      )
    ).toBeInTheDocument();
    expect(onProfessionalUpdate).not.toHaveBeenCalled();
  });
});
