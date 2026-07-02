/* eslint-disable no-undef */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder, TextDecoder } from 'util';
import Team from '../Team';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchStaffMembers,
  importStaffCSV,
  fetchStaffImportTemplate,
  exportStaffCSV,
} from '../../api/staff';
import { ThemeProvider } from '../../contexts/ThemeContext';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

jest.mock('../../hooks/useTenant', () => ({ useTenant: jest.fn() }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: jest.fn(() => Promise.resolve([])),
  fetchProfessionalsWithMeta: jest.fn(() =>
    Promise.resolve({ results: [], meta: { totalCount: 0 } })
  ),
  createProfessional: jest.fn(() => Promise.resolve({})),
  updateProfessional: jest.fn(() => Promise.resolve({})),
  deleteProfessional: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('../../api/staff');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
  }),
}));

function renderTeam() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('Team import/export', () => {
  const managerStaffMember = {
    id: 1,
    email: 'manager@example.com',
    role: 'manager',
    status: 'active',
    first_name: 'Casey',
    last_name: 'Manager',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'aurora' });
    useAuth.mockReturnValue({ user: { email: 'manager@example.com' } });
    fetchStaffMembers.mockResolvedValue({ staff: [managerStaffMember], requestId: null });
    global.URL.createObjectURL = jest.fn(() => 'blob:staff-export');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('opens the import modal from the actions dropdown', async () => {
    renderTeam();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar staff'));

    expect(
      await screen.findByText('Importar staff', { selector: 'h2' })
    ).toBeInTheDocument();
  });

  it('exports staff as CSV from the actions dropdown', async () => {
    const blob = new Blob(['id,name']);
    exportStaffCSV.mockResolvedValueOnce(blob);

    renderTeam();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Exportar staff'));

    await waitFor(() => {
      expect(exportStaffCSV).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('downloads the CSV template from the import modal', async () => {
    const blob = new Blob(['name,email,role']);
    fetchStaffImportTemplate.mockResolvedValueOnce(blob);

    renderTeam();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar staff'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar modelo CSV' })
    );

    await waitFor(() => {
      expect(fetchStaffImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('imports a CSV file and refreshes the list on success', async () => {
    importStaffCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importStaffCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });

    renderTeam();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar staff'));

    const file = new File(['name,email,role\nJohn,john@example.com,collaborator'], 'staff.csv', {
      type: 'text/csv',
    });
    fireEvent.change(await screen.findByLabelText('Ficheiro CSV'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    const confirmButton = await screen.findByRole('button', {
      name: 'Confirmar importação',
    });
    const callsBeforeConfirm = fetchStaffMembers.mock.calls.length;
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(importStaffCSV).toHaveBeenNthCalledWith(2, file, {
        dryRun: false,
        slug: 'aurora',
      });
    });
    await waitFor(() => {
      expect(fetchStaffMembers.mock.calls.length).toBeGreaterThan(
        callsBeforeConfirm
      );
    });
  });
});
