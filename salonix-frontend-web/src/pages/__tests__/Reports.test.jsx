import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Reports from '../Reports';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import { useStaff } from '../../hooks/useStaff';
import useFeatureLock from '../../hooks/useFeatureLock';
import { useReportsData } from '../../hooks/useReportsData';
import useToast from '../../hooks/useToast';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useStaff', () => ({
  useStaff: jest.fn(),
}));

jest.mock('../../hooks/useFeatureLock', () => jest.fn());

jest.mock('../../hooks/useReportsData', () => ({
  useReportsData: jest.fn(),
}));

jest.mock('../../hooks/useToast', () => jest.fn());

jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../components/ui/PageHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

jest.mock('../../components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }) => <section>{children}</section>,
}));

jest.mock('../../components/reports/BasicReportsMetrics', () => ({
  __esModule: true,
  default: () => <div>basic-metrics</div>,
}));

jest.mock('../../components/reports/DateFilters', () => ({
  __esModule: true,
  default: () => <div>date-filters</div>,
}));

jest.mock('../../components/reports/ExportButton', () => ({
  __esModule: true,
  default: () => <button type="button">export-basic</button>,
}));

jest.mock('../../components/reports/AdvancedExportButton', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/reports/TopServices', () => ({
  __esModule: true,
  default: () => <div>top-services</div>,
}));

jest.mock('../../components/reports/RevenueChart', () => ({
  __esModule: true,
  default: () => <div>revenue-chart</div>,
}));

jest.mock('../../components/reports/AdvancedFilters', () => ({
  __esModule: true,
  default: () => <div>advanced-filters</div>,
}));

jest.mock('../../components/ui/ToastContainer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/security/UpgradePrompt', () => ({
  __esModule: true,
  default: () => <div>upgrade-prompt</div>,
}));

jest.mock('../../api/reports', () => ({
  exportTopServicesReport: jest.fn(),
  exportRevenueReport: jest.fn(),
  downloadCSV: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      let template = key;
      let values = {};
      if (typeof defaultValueOrOptions === 'string') {
        template = defaultValueOrOptions;
      } else if (
        defaultValueOrOptions &&
        typeof defaultValueOrOptions === 'object'
      ) {
        if (typeof defaultValueOrOptions.defaultValue === 'string') {
          template = defaultValueOrOptions.defaultValue;
        }
        values = defaultValueOrOptions;
      }
      if (maybeOptions && typeof maybeOptions === 'object') {
        if (typeof maybeOptions.defaultValue === 'string') {
          template = maybeOptions.defaultValue;
        }
        values = { ...values, ...maybeOptions };
      }
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        Object.prototype.hasOwnProperty.call(values, token) ? values[token] : ''
      );
    },
    i18n: {
      language: 'pt-BR',
    },
  }),
}));

describe('Reports page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({
      slug: 'aurora',
      profile: { email: 'owner@example.com' },
      plan: { tier: 'pro' },
    });
    useAuth.mockReturnValue({
      user: { email: 'owner@example.com', username: 'owner' },
    });
    useStaff.mockReturnValue({
      staff: [],
      error: null,
      forbidden: false,
    });
    useFeatureLock.mockReturnValue({ isLocked: false });
    useToast.mockReturnValue({
      toasts: [],
      showSuccess: jest.fn(),
      showError: jest.fn(),
      hideToast: jest.fn(),
    });
    useReportsData.mockImplementation(({ type }) => {
      if (type === 'business') {
        return {
          data: { businessReports: null },
          loading: false,
          error: null,
          forbidden: true,
          refetch: jest.fn(),
        };
      }

      if (type === 'insights') {
        return {
          data: { insightsReports: null },
          loading: false,
          error: null,
          forbidden: true,
          refetch: jest.fn(),
        };
      }

      return {
        data: {
          basicReports: {
            appointments_total: 1,
            period: { start: '2026-04-01', end: '2026-04-28' },
          },
        },
        loading: false,
        error: null,
        forbidden: false,
        refetch: jest.fn(),
      };
    });
  });

  it('mostra acesso negado para usuário não owner', () => {
    useStaff.mockReturnValue({
      staff: [{ email: 'owner@example.com', role: 'manager' }],
      error: null,
      forbidden: false,
    });

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    expect(
      screen.getByText('Apenas proprietários têm acesso aos relatórios.')
    ).toBeInTheDocument();
  });

  it('exibe upgrade para business quando API retorna 403', () => {
    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Análise de Negócio' }));

    expect(
      screen.getByText(
        'Disponível a partir do plano Pro. Faça upgrade para acessar esta seção.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar plano' }));
    expect(mockNavigate).toHaveBeenCalledWith('/plans');
  });

  it('exibe upgrade para insights quando API retorna 403', () => {
    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Insights Avançados' }));

    expect(
      screen.getByText(
        'Disponível a partir do plano Pro. Desbloqueie análises de retenção e insights profundos.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar plano' }));
    expect(mockNavigate).toHaveBeenCalledWith('/plans');
  });
});
