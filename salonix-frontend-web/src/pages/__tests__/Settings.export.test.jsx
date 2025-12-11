/* eslint-env jest */
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { DataSettingsStandalone } from '../Settings';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k, fallback) => fallback || _k }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    slug: 'aurora',
    tenant: { slug: 'aurora', name: 'Aurora' },
  }),
}));

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../../api/reports', () => ({
  __esModule: true,
  downloadCSV: jest.fn(),
}));

describe('Settings export CSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exporta clientes com nome via Content-Disposition', async () => {
    const client = (await import('../../api/client')).default;
    const { downloadCSV } = await import('../../api/reports');
    const blob = new Blob(['name,email\nA,a@e.com'], { type: 'text/csv' });
    client.get.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="customers.csv"',
      },
    });

    render(<DataSettingsStandalone />);
    fireEvent.click(screen.getByText('Exportação (CSV)'));

    const link = screen.getByText('Exportar CSV de Clientes');
    fireEvent.click(link);

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        'export/customers.csv',
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Tenant-Slug': 'aurora' }),
          responseType: 'blob',
        })
      );
    });
    expect(downloadCSV).toHaveBeenCalledWith(blob, 'customers.csv');
  });

  it('exporta serviços com fallback de nome quando header ausente', async () => {
    const client = (await import('../../api/client')).default;
    const { downloadCSV } = await import('../../api/reports');
    client.get.mockResolvedValueOnce({
      data: new Blob(['name\nX'], { type: 'text/csv' }),
      headers: {},
    });

    render(<DataSettingsStandalone />);
    fireEvent.click(screen.getByText('Exportação (CSV)'));

    const link = screen.getByText('Exportar CSV de Serviços');
    fireEvent.click(link);

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        'export/services.csv',
        expect.objectContaining({ responseType: 'blob' })
      );
    });
    expect(downloadCSV).toHaveBeenCalledWith(
      expect.any(Blob),
      'services-export.csv'
    );
  });

  it('exibe mensagem amigável ao receber 429 com retry-after', async () => {
    const client = (await import('../../api/client')).default;
    client.get.mockRejectedValueOnce({
      response: {
        status: 429,
        headers: { 'retry-after': '3', 'x-request-id': 'req-1' },
      },
    });

    render(<DataSettingsStandalone />);
    fireEvent.click(screen.getByText('Exportação (CSV)'));

    const link = screen.getByText('Exportar CSV de Profissionais');
    fireEvent.click(link);

    const msgs = await screen.findAllByText(/Tente novamente em 3s/);
    expect(msgs.length).toBeGreaterThan(0);
  });
});
