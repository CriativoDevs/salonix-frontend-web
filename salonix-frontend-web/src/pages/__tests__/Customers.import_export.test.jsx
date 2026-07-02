import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Customers from '../Customers';
import {
  fetchCustomers,
  importCustomersCSV,
  fetchCustomersImportTemplate,
  exportCustomersCSV,
} from '../../api/customers';
import useCreditGate from '../../hooks/useCreditGate';

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora', flags: {}, featureFlagsRaw: null }),
}));

jest.mock('../../hooks/useCreditGate');

jest.mock('../../api/customers');

jest.mock('../../components/credits/CreditBlockModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/credits/CreditPurchaseModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/customers/CustomerPhotoPreviewModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
  }),
}));

function renderCustomers() {
  return render(
    <MemoryRouter>
      <Customers />
    </MemoryRouter>
  );
}

describe('Customers import/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchCustomers.mockResolvedValue({ results: [], count: 0 });
    useCreditGate.mockReturnValue({
      checkCredits: () => true,
      getCost: () => 1,
    });
    global.URL.createObjectURL = jest.fn(() => 'blob:customers-export');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('opens the import modal from the actions dropdown', async () => {
    renderCustomers();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar clientes'));

    expect(
      await screen.findByText('Importar clientes', { selector: 'h2' })
    ).toBeInTheDocument();
  });

  it('exports customers as CSV from the actions dropdown', async () => {
    const blob = new Blob(['id,name']);
    exportCustomersCSV.mockResolvedValueOnce(blob);

    renderCustomers();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Exportar clientes'));

    await waitFor(() => {
      expect(exportCustomersCSV).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('downloads the CSV template from the import modal', async () => {
    const blob = new Blob(['name,email,phone']);
    fetchCustomersImportTemplate.mockResolvedValueOnce(blob);

    renderCustomers();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar clientes'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar modelo CSV' })
    );

    await waitFor(() => {
      expect(fetchCustomersImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('imports a CSV file and refreshes the list on success', async () => {
    importCustomersCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importCustomersCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });

    renderCustomers();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar clientes'));

    const file = new File(['name,email\nJohn,john@example.com'], 'customers.csv', {
      type: 'text/csv',
    });
    fireEvent.change(await screen.findByLabelText('Ficheiro CSV'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    const confirmButton = await screen.findByRole('button', {
      name: 'Confirmar importação',
    });
    const callsBeforeConfirm = fetchCustomers.mock.calls.length;
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(importCustomersCSV).toHaveBeenNthCalledWith(2, file, {
        dryRun: false,
        slug: 'aurora',
      });
    });
    await waitFor(() => {
      expect(fetchCustomers.mock.calls.length).toBeGreaterThan(
        callsBeforeConfirm
      );
    });
  });
});
