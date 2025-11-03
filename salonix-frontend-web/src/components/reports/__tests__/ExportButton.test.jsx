/* eslint-env jest */
/* global global */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ExportButton from '../ExportButton';
import { exportBasicReportsCSV } from '../../../api/reports';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

jest.mock('../../../api/reports', () => ({
  exportBasicReportsCSV: jest.fn(),
}));

// Mock do URL.createObjectURL e URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('ExportButton', () => {
  const defaultFilters = {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza botão de exportar', () => {
    const { container } = render(<ExportButton filters={defaultFilters} disabled={false} />);
    
    expect(container.querySelector('a')).toBeInTheDocument();
  });

  it('desabilita botão quando disabled é true', () => {
    const { container } = render(<ExportButton filters={defaultFilters} disabled={true} />);
    
    const link = container.querySelector('a');
    expect(link).toHaveClass('opacity-50');
    expect(link).toHaveClass('cursor-not-allowed');
  });

  it('chama API de exportação quando clicado', async () => {
    const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
    exportBasicReportsCSV.mockResolvedValueOnce(mockBlob);

    const { container } = render(<ExportButton filters={defaultFilters} disabled={false} />);
    
    const exportLink = container.querySelector('a');
    fireEvent.click(exportLink);

    await waitFor(() => {
      expect(exportBasicReportsCSV).toHaveBeenCalledWith(defaultFilters);
    });
  });

  it('trata erro na exportação', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    exportBasicReportsCSV.mockRejectedValueOnce(new Error('Export failed'));

    const { container } = render(<ExportButton filters={defaultFilters} disabled={false} />);
    
    const exportLink = container.querySelector('a');
    fireEvent.click(exportLink);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Erro ao exportar CSV:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});