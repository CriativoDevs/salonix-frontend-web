import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageStaffModal from '../ManageStaffModal';

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
    const onUpdate = jest.fn().mockResolvedValue({ success: true, requestId: 'req-1' });

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
    const onUpdate = jest.fn().mockResolvedValue({ success: true, requestId: 'req-2' });
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

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
});
