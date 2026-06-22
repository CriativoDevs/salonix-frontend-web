/* eslint-env jest */
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountSettings from '../AccountSettings';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k, fallback) => fallback || _k }),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ plan: 'basic', loading: false }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'owner@aurora.com', full_name: 'Owner Aurora' },
    logout: jest.fn(),
  }),
}));

jest.mock('../../hooks/useBillingOverview', () => ({
  __esModule: true,
  default: () => ({ overview: null, loading: false }),
}));

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../../api/reports', () => ({
  __esModule: true,
  downloadBlob: jest.fn(),
  downloadCSV: jest.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountSettings />
    </MemoryRouter>
  );
}

describe('AccountSettings — exportação RGPD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exporta os dados via blob e dispara o download', async () => {
    const client = (await import('../../api/client')).default;
    const { downloadBlob } = await import('../../api/reports');
    const blob = new Blob(['{"data":{}}'], { type: 'application/json' });
    client.get.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition':
          'attachment; filename="timelyone-data-export-aurora.json"',
      },
    });

    renderPage();
    fireEvent.click(screen.getByText('Exportar os meus dados'));

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        'tenants/data-export/',
        expect.objectContaining({ responseType: 'blob' })
      );
    });
    expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      'timelyone-data-export-aurora.json'
    );
  });

  it('mostra mensagem amigável quando recebe 429', async () => {
    const client = (await import('../../api/client')).default;
    client.get.mockRejectedValueOnce({
      response: { status: 429, headers: {}, data: {} },
    });

    renderPage();
    fireEvent.click(screen.getByText('Exportar os meus dados'));

    await waitFor(() => {
      expect(screen.getByText(/Muitas tentativas/i)).toBeInTheDocument();
    });
  });
});
