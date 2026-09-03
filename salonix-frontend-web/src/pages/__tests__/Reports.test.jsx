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
  default: ({ fromDate, toDate }) => (
    <div>
      date-filters
      <span data-testid="date-filters-from">{fromDate}</span>
      <span data-testid="date-filters-to">{toDate}</span>
    </div>
  ),
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
  default: ({
    interval,
    professionalId,
    onProfessionalChange,
    serviceId,
    onServiceChange,
  }) => (
    <div>
      advanced-filters
      <span data-testid="af-interval">{interval}</span>
      <span data-testid="af-professional">{professionalId}</span>
      <span data-testid="af-service">{serviceId}</span>
      <button type="button" onClick={() => onProfessionalChange('7')}>
        set-professional
      </button>
      <button type="button" onClick={() => onServiceChange('9')}>
        set-service
      </button>
    </div>
  ),
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

jest.mock('../../api/services', () => ({
  fetchServices: jest.fn(() => Promise.resolve([])),
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
        'Esta secção não está disponível na sua conta. Contacte o suporte se precisar de acesso.'
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
        'Esta secção não está disponível na sua conta. Contacte o suporte se precisar de acesso.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar plano' }));
    expect(mockNavigate).toHaveBeenCalledWith('/plans');
  });

  it('usa o mês corrente (dia 1 até hoje) como período padrão, já refletido nos campos de data', () => {
    const formatDateForInput = (date) => new Date(date).toISOString().split('T')[0];
    const now = new Date();
    const expectedFrom = formatDateForInput(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const expectedTo = formatDateForInput(now);

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    expect(screen.getByTestId('date-filters-from')).toHaveTextContent(
      expectedFrom
    );
    expect(screen.getByTestId('date-filters-to')).toHaveTextContent(
      expectedTo
    );

    // O mesmo período deve ter sido usado na chamada inicial ao hook de dados
    const basicCall = useReportsData.mock.calls
      .map(([args]) => args)
      .find((args) => args.type === 'basic');
    expect(basicCall.filters).toEqual({ from: expectedFrom, to: expectedTo });
  });

  it('propaga interval, profissional e serviço para o fetch da Análise de Negócio', () => {
    useReportsData.mockImplementation(({ type }) => {
      if (type === 'business') {
        return {
          data: {
            businessReports: {
              top_services: [],
              revenue: { series: [] },
            },
          },
          loading: false,
          error: null,
          forbidden: false,
          refetch: jest.fn(),
        };
      }
      return {
        data: { basicReports: null },
        loading: false,
        error: null,
        forbidden: false,
        refetch: jest.fn(),
      };
    });

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Análise de Negócio' }));

    expect(screen.getByTestId('af-interval')).toHaveTextContent('day');

    fireEvent.click(screen.getByText('set-professional'));
    fireEvent.click(screen.getByText('set-service'));

    const lastBusinessCall = useReportsData.mock.calls
      .map(([args]) => args)
      .filter((args) => args.type === 'business')
      .pop();

    expect(lastBusinessCall.filters).toEqual(
      expect.objectContaining({
        interval: 'day',
        professional_id: '7',
        service_id: '9',
      })
    );
    expect(lastBusinessCall.filters).not.toHaveProperty('limit');
  });

  it('propaga apenas professional_id (sem service_id) para o fetch de Insights/Retenção', () => {
    useStaff.mockReturnValue({
      staff: [
        { id: 7, first_name: 'Ana', last_name: 'Silva', email: 'ana@example.com' },
      ],
      error: null,
      forbidden: false,
    });
    useReportsData.mockImplementation(({ type }) => {
      if (type === 'insights') {
        return {
          data: {
            insightsReports: {
              retention: {
                new_clients: { qty: 1, revenue: 10 },
                returning_clients: { qty: 1, revenue: 10 },
              },
              period: { start: '2026-04-01', end: '2026-04-28' },
            },
          },
          loading: false,
          error: null,
          forbidden: false,
          refetch: jest.fn(),
        };
      }
      return {
        data: { basicReports: null },
        loading: false,
        error: null,
        forbidden: false,
        refetch: jest.fn(),
      };
    });

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Insights Avançados' }));

    const professionalSelect = screen.getByLabelText('Profissional');
    fireEvent.change(professionalSelect, { target: { value: '7' } });

    const lastInsightsCall = useReportsData.mock.calls
      .map(([args]) => args)
      .filter((args) => args.type === 'insights')
      .pop();

    expect(lastInsightsCall.filters).toEqual(
      expect.objectContaining({ professional_id: '7' })
    );
    expect(lastInsightsCall.filters).not.toHaveProperty('service_id');
    expect(lastInsightsCall.filters).not.toHaveProperty('interval');
    expect(lastInsightsCall.filters).not.toHaveProperty('limit');
  });
});
