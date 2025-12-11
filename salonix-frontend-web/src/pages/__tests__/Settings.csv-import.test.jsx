import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { TextEncoder, TextDecoder } from 'util';
import Settings, { DataSettingsStandalone } from '../Settings';
import client from '../../api/client';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

jest.mock('../../routes/RoleProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

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

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { slug: 'salonix' }, branding: {} }),
}));

jest.mock('../../hooks/useCreditBalance', () => ({
  __esModule: true,
  default: () => ({
    balance: { current_balance: 0 },
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../hooks/useBillingOverview', () => ({
  __esModule: true,
  default: () => ({ overview: {}, refresh: jest.fn() }),
}));

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

describe('Settings CSV import UI', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    if (console.log && console.log.mockRestore) console.log.mockRestore();
  });

  it('sugere mapeamento para Nome/Email/Telefone no preview', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <DataSettingsStandalone />
        </MemoryRouter>
      </ThemeProvider>
    );

    // standalone não requer seleção de aba

    const fileInput = await screen.findByLabelText('Arquivo CSV');
    const csv = 'Nome,Email,Telefone\nAna,ana@example.com,+351911111111\n';
    if (typeof File !== 'undefined') {
      if (!File.prototype.text) {
        Object.defineProperty(File.prototype, 'text', {
          configurable: true,
          writable: true,
          value: jest.fn().mockResolvedValue(csv),
        });
      } else {
        jest.spyOn(File.prototype, 'text').mockResolvedValue(csv);
      }
    }
    const file = new File([csv], 'customers.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(screen.getByText('Mapeamento de colunas')).toBeInTheDocument();
    });

    const selectNome = screen.getByLabelText('Mapear coluna Nome');
    const selectEmail = screen.getByLabelText('Mapear coluna Email');
    const selectTelefone = screen.getByLabelText('Mapear coluna Telefone');

    expect(selectNome.value).toBe('name');
    expect(selectEmail.value).toBe('email');
    expect(selectTelefone.value).toBe('phone');
  });

  it('dry-run executa validação sem erros', async () => {
    client.post.mockResolvedValue({
      data: {
        summary: {
          processed: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [],
        },
      },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <DataSettingsStandalone />
        </MemoryRouter>
      </ThemeProvider>
    );

    // standalone não requer seleção de aba

    const fileInput = await screen.findByLabelText('Arquivo CSV');
    const csv = 'name,email,phone\nAna,ana@example.com,+351911111111\n';
    if (typeof File !== 'undefined') {
      if (!File.prototype.text) {
        Object.defineProperty(File.prototype, 'text', {
          configurable: true,
          writable: true,
          value: jest.fn().mockResolvedValue(csv),
        });
      } else {
        jest.spyOn(File.prototype, 'text').mockResolvedValue(csv);
      }
    }
    const file = new File([csv], 'customers.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    jest.runOnlyPendingTimers();

    const dryRunBtn = await screen.findByRole('button', {
      name: 'Validar (dry-run)',
    });
    fireEvent.click(dryRunBtn);
    jest.runOnlyPendingTimers();
    await waitFor(() => {
      expect(screen.getByText('Nenhum erro encontrado')).toBeInTheDocument();
    });
  });

  it('normaliza duração e preço para serviços', async () => {
    client.post.mockResolvedValue({
      data: {
        summary: {
          processed: 1,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [],
        },
      },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <DataSettingsStandalone />
        </MemoryRouter>
      </ThemeProvider>
    );

    const entitySelect = screen.getByRole('combobox');
    fireEvent.change(entitySelect, { target: { value: 'services' } });

    const fileInput = await screen.findByLabelText('Arquivo CSV');
    const csv = 'name;duration_minutes;price_eur\nCorte;1h 30m;12,50\n';
    if (typeof File !== 'undefined') {
      if (!File.prototype.text) {
        Object.defineProperty(File.prototype, 'text', {
          configurable: true,
          writable: true,
          value: jest.fn().mockResolvedValue(csv),
        });
      } else {
        jest.spyOn(File.prototype, 'text').mockResolvedValue(csv);
      }
    }
    const file = new File([csv], 'services.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    jest.runOnlyPendingTimers();

    const dryRunBtn = await screen.findByRole('button', {
      name: 'Validar (dry-run)',
    });
    fireEvent.click(dryRunBtn);
    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(screen.getByText('Nenhum erro encontrado')).toBeInTheDocument();
      expect(screen.getByText('Processados: 1')).toBeInTheDocument();
    });
  });

  it('relatório de erros com destaque de campo e motivo', async () => {
    client.post.mockResolvedValue({
      data: {
        summary: {
          processed: 1,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [
            { line: 2, error: 'email inválido', row: { email: 'invalid' } },
            { line: 2, error: 'phone inválido', row: { phone: '911' } },
          ],
        },
      },
    });
    jest.useRealTimers();
    render(
      <ThemeProvider>
        <MemoryRouter>
          <DataSettingsStandalone />
        </MemoryRouter>
      </ThemeProvider>
    );

    const fileInput = await screen.findByLabelText('Arquivo CSV');
    const csv = 'name,email,phone\nAna,ana@example.com,+351911111111\n';
    if (typeof File !== 'undefined') {
      if (!File.prototype.text) {
        Object.defineProperty(File.prototype, 'text', {
          configurable: true,
          writable: true,
          value: jest.fn().mockResolvedValue(csv),
        });
      } else {
        jest.spyOn(File.prototype, 'text').mockResolvedValue(csv);
      }
    }
    const file = new File([csv], 'customers.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    const dryRunBtn = await screen.findByRole('button', {
      name: 'Validar (dry-run)',
    });
    fireEvent.click(dryRunBtn);

    await waitFor(() => {
      expect(screen.getByText('Erros encontrados')).toBeInTheDocument();
      expect(screen.getByText('Por campo:')).toBeInTheDocument();
      expect(screen.getByText('email (1)')).toBeInTheDocument();
      expect(screen.getByText('phone (1)')).toBeInTheDocument();
      expect(screen.getByText('Por motivo:')).toBeInTheDocument();
      expect(screen.getByText('email inválido (1)')).toBeInTheDocument();
      expect(screen.getByText('phone inválido (1)')).toBeInTheDocument();
    });
    const logCalls = (console.log && console.log.mock?.calls) || [];
    const events = logCalls
      .filter((c) => c && c[0] === 'telemetry:event')
      .map((c) => c[1]);
    expect(events).toContain('csv_import_validation_breakdown');
  });

  it('emite telemetria de preview e mapeamento', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <DataSettingsStandalone />
        </MemoryRouter>
      </ThemeProvider>
    );

    const fileInput = await screen.findByLabelText('Arquivo CSV');
    const csv = 'Nome,Email,Telefone\nAna,ana@example.com,+351911111111\n';
    if (typeof File !== 'undefined') {
      if (!File.prototype.text) {
        Object.defineProperty(File.prototype, 'text', {
          configurable: true,
          writable: true,
          value: jest.fn().mockResolvedValue(csv),
        });
      } else {
        jest.spyOn(File.prototype, 'text').mockResolvedValue(csv);
      }
    }
    const file = new File([csv], 'customers.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(screen.getByText('Mapeamento de colunas')).toBeInTheDocument();
    });

    const logCalls = (console.log && console.log.mock?.calls) || [];
    const events = logCalls
      .filter((c) => c && c[0] === 'telemetry:event')
      .map((c) => c[1]);
    expect(events).toContain('csv_import_preview_ready');
    expect(events).toContain('csv_import_mapping_state');
  });
});
