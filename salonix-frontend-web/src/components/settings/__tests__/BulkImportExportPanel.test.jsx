/* eslint-env jest */
/* global global */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BulkImportExportPanel from '../BulkImportExportPanel';
import {
  exportCustomersCSV,
  fetchCustomersImportTemplate,
  importCustomersCSV,
} from '../../../api/customers';
import {
  exportServicesCSV,
  fetchServicesImportTemplate,
  importServicesCSV,
} from '../../../api/services';
import { exportStaffCSV, fetchStaffImportTemplate, importStaffCSV } from '../../../api/staff';
import {
  exportAppointmentsCSV,
  fetchAppointmentsImportTemplate,
  importAppointmentsCSV,
} from '../../../api/appointments';

jest.mock('../../../api/customers');
jest.mock('../../../api/services');
jest.mock('../../../api/staff');
jest.mock('../../../api/appointments');
jest.mock('../../../hooks/useTenant', () => ({ useTenant: () => ({ slug: 'aurora' }) }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
  }),
}));

const savedZipFiles = [];
jest.mock('jszip', () => {
  const mockZip = jest.fn().mockImplementation(() => {
    const files = {};
    return {
      file: (name, content) => {
        files[name] = content;
      },
      generateAsync: async () => {
        savedZipFiles.push(Object.keys(files));
        return new Blob(['zip-content']);
      },
    };
  });
  mockZip.loadAsync = jest.fn(async (fileOrBlob) => {
    const entries = fileOrBlob.__entries || {};
    return {
      files: Object.fromEntries(
        Object.keys(entries).map((name) => [
          name,
          {
            name,
            dir: false,
            async: async () => new Blob([entries[name]]),
          },
        ])
      ),
    };
  });
  return mockZip;
});

describe('BulkImportExportPanel — export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedZipFiles.length = 0;
    global.URL.createObjectURL = jest.fn(() => 'blob:bulk-export');
    global.URL.revokeObjectURL = jest.fn();
    exportCustomersCSV.mockResolvedValue(new Blob(['customers']));
    exportServicesCSV.mockResolvedValue(new Blob(['services']));
    exportStaffCSV.mockResolvedValue(new Blob(['staff']));
    exportAppointmentsCSV.mockResolvedValue(new Blob(['appointments']));
  });

  it('bundles the 4 CSVs into a single zip on export', async () => {
    render(<BulkImportExportPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar tudo (.zip)' }));

    await waitFor(() => {
      expect(exportCustomersCSV).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(exportServicesCSV).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(exportStaffCSV).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(exportAppointmentsCSV).toHaveBeenCalledWith({ slug: 'aurora' });
    });
    await waitFor(() => {
      expect(savedZipFiles[0]).toEqual(
        expect.arrayContaining(['customers.csv', 'services.csv', 'staff.csv', 'appointments.csv'])
      );
    });
  });

  it('bundles the 4 templates into a single zip on template download', async () => {
    fetchCustomersImportTemplate.mockResolvedValue(new Blob(['customers-template']));
    fetchServicesImportTemplate.mockResolvedValue(new Blob(['services-template']));
    fetchStaffImportTemplate.mockResolvedValue(new Blob(['staff-template']));
    fetchAppointmentsImportTemplate.mockResolvedValue(new Blob(['appointments-template']));

    render(<BulkImportExportPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar modelo ZIP' }));

    await waitFor(() => {
      expect(fetchCustomersImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(fetchServicesImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(fetchStaffImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
      expect(fetchAppointmentsImportTemplate).toHaveBeenCalledWith({ slug: 'aurora' });
    });
  });
});

function buildZipFile(entries) {
  const file = new File(['zip-bytes'], 'dados.zip', { type: 'application/zip' });
  file.__entries = entries;
  return file;
}

describe('BulkImportExportPanel — import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedZipFiles.length = 0;
  });

  it('runs dry-run on every CSV present in the zip and shows a combined summary', async () => {
    importCustomersCSV.mockResolvedValue({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importServicesCSV.mockResolvedValue({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });

    render(<BulkImportExportPanel />);

    const file = buildZipFile({
      'customers.csv': 'name,email\nAna,ana@x.com',
      'services.csv': 'name\nCorte',
    });
    fireEvent.change(screen.getByLabelText('Ficheiro ZIP'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    await waitFor(() => {
      expect(importCustomersCSV).toHaveBeenCalledWith(
        expect.anything(),
        { dryRun: true, slug: 'aurora' }
      );
      expect(importServicesCSV).toHaveBeenCalledWith(
        expect.anything(),
        { dryRun: true, slug: 'aurora' }
      );
    });
    expect(importStaffCSV).not.toHaveBeenCalled();
    expect(importAppointmentsCSV).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Confirmar importação' })
    ).not.toBeDisabled();
  });

  it('disables confirmation when any dry-run in the zip has errors', async () => {
    importCustomersCSV.mockResolvedValue({
      summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
    });
    importServicesCSV.mockResolvedValue({
      summary: {
        processed: 1,
        created: 0,
        updated: 0,
        skipped: 1,
        errors: [{ line: 2, error: 'Nome em falta' }],
      },
    });

    render(<BulkImportExportPanel />);

    const file = buildZipFile({
      'customers.csv': 'name,email\nAna,ana@x.com',
      'services.csv': 'name\n',
    });
    fireEvent.change(screen.getByLabelText('Ficheiro ZIP'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    await waitFor(() => {
      expect(screen.getByText(/Linha 2: Nome em falta/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'Confirmar importação' })
    ).toBeDisabled();
  });

  it('confirms with dryRun false only for the files present after a clean preview', async () => {
    importCustomersCSV
      .mockResolvedValueOnce({
        summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
      })
      .mockResolvedValueOnce({
        summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
      });

    render(<BulkImportExportPanel />);

    const file = buildZipFile({ 'customers.csv': 'name,email\nAna,ana@x.com' });
    fireEvent.change(screen.getByLabelText('Ficheiro ZIP'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));
    await screen.findByRole('button', { name: 'Confirmar importação' });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar importação' }));

    await waitFor(() => {
      expect(importCustomersCSV).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        { dryRun: false, slug: 'aurora' }
      );
    });
    expect(importServicesCSV).not.toHaveBeenCalled();
    expect(importStaffCSV).not.toHaveBeenCalled();
    expect(importAppointmentsCSV).not.toHaveBeenCalled();
  });
});
