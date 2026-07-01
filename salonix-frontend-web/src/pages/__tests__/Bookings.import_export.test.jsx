import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Bookings from '../Bookings';
import {
  fetchAppointments,
  importAppointmentsCSV,
  fetchAppointmentsImportTemplate,
  exportAppointmentsCSV,
} from '../../api/appointments';
import { fetchCustomers } from '../../api/customers';
import { fetchServices } from '../../api/services';
import { fetchProfessionals } from '../../api/professionals';
import { fetchTenantBusinessHours } from '../../api/tenant';

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

jest.mock('../../api/appointments');
jest.mock('../../api/customers');
jest.mock('../../api/services');
jest.mock('../../api/professionals');
jest.mock('../../api/tenant');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string'
        ? defaultValueOrOptions
        : key,
  }),
}));

function renderBookings() {
  return render(
    <MemoryRouter>
      <Bookings />
    </MemoryRouter>
  );
}

describe('Bookings import/export de agendamentos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAppointments.mockResolvedValue({ results: [], count: 0 });
    fetchCustomers.mockResolvedValue({ results: [], count: 0 });
    fetchServices.mockResolvedValue({ results: [], count: 0 });
    fetchProfessionals.mockResolvedValue({ results: [], count: 0 });
    fetchTenantBusinessHours.mockResolvedValue(null);
    global.URL.createObjectURL = jest.fn(() => 'blob:appointments-export');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('opens the import modal from the actions dropdown', async () => {
    renderBookings();

    const trigger = await screen.findByRole('button', {
      name: 'Importar/Exportar',
    });
    fireEvent.click(trigger);

    fireEvent.click(await screen.findByText('Importar agendamentos'));

    expect(await screen.findByText('Importar agendamentos', { selector: 'h2' })).toBeInTheDocument();
  });

  it('exports appointments as CSV from the actions dropdown', async () => {
    const blob = new Blob(['id,status']);
    exportAppointmentsCSV.mockResolvedValueOnce(blob);

    renderBookings();

    const trigger = await screen.findByRole('button', {
      name: 'Importar/Exportar',
    });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText('Exportar agendamentos'));

    await waitFor(() => {
      expect(exportAppointmentsCSV).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('imports a CSV file and refreshes the list on success', async () => {
    importAppointmentsCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importAppointmentsCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });

    renderBookings();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar agendamentos'));

    const file = new File(['a,b\n1,2'], 'appointments.csv', {
      type: 'text/csv',
    });
    fireEvent.change(await screen.findByLabelText('Ficheiro CSV'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    const confirmButton = await screen.findByRole('button', {
      name: 'Confirmar importação',
    });
    const callsBeforeConfirm = fetchAppointments.mock.calls.length;
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(importAppointmentsCSV).toHaveBeenNthCalledWith(2, file, {
        dryRun: false,
        slug: 'aurora',
      });
    });
    await waitFor(() => {
      expect(fetchAppointments.mock.calls.length).toBeGreaterThan(
        callsBeforeConfirm
      );
    });
  });

  it('downloads the CSV template from the import modal', async () => {
    const blob = new Blob(['col1,col2']);
    fetchAppointmentsImportTemplate.mockResolvedValueOnce(blob);

    renderBookings();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar agendamentos'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar modelo CSV' })
    );

    await waitFor(() => {
      expect(fetchAppointmentsImportTemplate).toHaveBeenCalledWith({
        slug: 'aurora',
      });
    });
  });
});
