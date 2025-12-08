import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../Settings';
import client from '../../api/client';
jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../components/ui/PageHeader', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

// Settings import moved to ESM above

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { email: 'admin@demo.local' },
  }),
}));

jest.mock('../../hooks/useStaff', () => ({
  useStaff: () => ({
    staff: [],
    loading: false,
    error: new Error('x'),
    forbidden: true,
  }),
}));

const stableTenant = { slug: 'aurora' };
const stableBranding = {};
const stableChannels = {};
const stableProfile = {};

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    slug: 'aurora',
    tenant: stableTenant,
    branding: stableBranding,
    channels: stableChannels,
    profile: stableProfile,
    loading: false,
    plan: null,
    modules: {},
    flags: {},
    featureFlagsRaw: null,
    error: null,
    refetch: jest.fn(),
    applyTenantBootstrap: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, d) => (typeof d === 'string' ? d : k) }),
}));

// client import moved to ESM above

describe('Settings CSV import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete window.analytics;
    window.gtag = jest.fn();
  });

  it('dry-run normaliza CSV e track success', async () => {
    client.post.mockResolvedValueOnce({
      data: {
        summary: { created: 1, processed: 1, errors: [] },
        request_id: 'req-1',
      },
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const dataTab = await screen.findByText('settings.tabs.data');
    fireEvent.click(dataTab);

    const input = await screen.findByLabelText('Arquivo CSV');
    const file = new File(
      ['Nome;Email;Telefone\nAna;a@b.c;00351911509258\n'],
      'clientes.csv',
      { type: 'text/csv' }
    );
    fireEvent.change(input, { target: { files: [file] } });

    const dryRunBtn = await screen.findByText('Validar (dry-run)');
    fireEvent.click(dryRunBtn);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalled();
    });

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'csv_import_dry_run_success',
      expect.objectContaining({ dry_run: true, errors_count: 0 })
    );
  });

  it('dry-run track failure em 403', async () => {
    const err = Object.assign(new Error('Forbidden'), {
      response: { status: 403, headers: { 'x-request-id': 'req-err-1' } },
    });
    client.post.mockRejectedValueOnce(err);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const dataTab = await screen.findByText('settings.tabs.data');
    fireEvent.click(dataTab);

    const input = await screen.findByLabelText('Arquivo CSV');
    const file = new File(
      ['Nome;Email;Telefone\nAna;a@b.c;351911509258\n'],
      'clientes.csv',
      { type: 'text/csv' }
    );
    fireEvent.change(input, { target: { files: [file] } });

    const dryRunBtn = await screen.findByText('Validar (dry-run)');
    fireEvent.click(dryRunBtn);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalled();
    });

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'csv_import_dry_run_failure',
      expect.objectContaining({
        dry_run: true,
        status: 403,
        request_id: 'req-err-1',
      })
    );
  });
});
