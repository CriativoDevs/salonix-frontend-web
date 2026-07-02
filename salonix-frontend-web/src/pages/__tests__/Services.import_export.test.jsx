import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Services from '../Services';
import {
  fetchServices,
  importServicesCSV,
  fetchServicesImportTemplate,
  exportServicesCSV,
} from '../../api/services';

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

jest.mock('../../api/services');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
    i18n: { language: 'pt' },
  }),
}));

jest.mock('../../api/reports', () => ({
  downloadBlob: jest.fn(),
}));

function renderServices() {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>
  );
}

describe('Services import/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchServices.mockResolvedValue([]);
    global.URL.createObjectURL = jest.fn(() => 'blob:services-export');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('opens the import modal from the actions dropdown', async () => {
    renderServices();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar serviços'));

    expect(
      await screen.findByText('Importar serviços', { selector: 'h2' })
    ).toBeInTheDocument();
  });

  it('exports services as CSV from the actions dropdown', async () => {
    const blob = new Blob(['id,name']);
    exportServicesCSV.mockResolvedValueOnce(blob);

    renderServices();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Exportar serviços'));

    await waitFor(() => {
      expect(exportServicesCSV).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('downloads the CSV template from the import modal', async () => {
    const blob = new Blob(['name,price_eur,duration_minutes']);
    fetchServicesImportTemplate.mockResolvedValueOnce(blob);

    renderServices();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar serviços'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar modelo CSV' })
    );

    await waitFor(() => {
      expect(fetchServicesImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });

  it('imports a CSV file and refreshes the list on success', async () => {
    importServicesCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importServicesCSV.mockResolvedValueOnce({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });

    renderServices();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Importar/Exportar' })
    );
    fireEvent.click(await screen.findByText('Importar serviços'));

    const file = new File(
      ['name,price_eur,duration_minutes\nShampoo,25.50,30'],
      'services.csv',
      {
        type: 'text/csv',
      }
    );
    fireEvent.change(await screen.findByLabelText('Ficheiro CSV'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    const confirmButton = await screen.findByRole('button', {
      name: 'Confirmar importação',
    });
    const callsBeforeConfirm = fetchServices.mock.calls.length;
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(importServicesCSV).toHaveBeenNthCalledWith(2, file, {
        dryRun: false,
        slug: 'aurora',
      });
    });
    await waitFor(() => {
      expect(fetchServices.mock.calls.length).toBeGreaterThan(
        callsBeforeConfirm
      );
    });
  });
});
