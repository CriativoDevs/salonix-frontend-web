import { renderHook, waitFor, act } from '@testing-library/react';
import { useReportsData } from '../useReportsData';
import {
  fetchBasicReports,
  fetchAdvancedReports,
  fetchTopServices,
  fetchRevenue,
  fetchRetention,
} from '../../api/reports';

// Mock das funções da API
jest.mock('../../api/reports', () => ({
  fetchBasicReports: jest.fn(),
  fetchAdvancedReports: jest.fn(),
  fetchTopServices: jest.fn(),
  fetchRevenue: jest.fn(),
  fetchRetention: jest.fn(),
}));

// Mock do parseApiError
jest.mock('../../utils/apiError', () => ({
  parseApiError: jest.fn(
    (error, defaultMessage) => defaultMessage || error.message
  ),
}));

describe('useReportsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega relatórios básicos com sucesso', async () => {
    const mockData = { reports: [{ id: 1, name: 'Test Report' }] };
    fetchBasicReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() =>
      useReportsData({ slug: 'test-salon', type: 'basic' })
    );

    expect(result.current.initialLoading).toBe(true);

    await waitFor(() => {
      expect(fetchBasicReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    });

    expect(result.current.data.basicReports).toEqual({
      ...mockData,
      period: { start: undefined, end: undefined },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('carrega relatórios avançados com sucesso', async () => {
    const mockData = { reports: [{ id: 2, name: 'Advanced Report' }] };
    fetchAdvancedReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() =>
      useReportsData({ slug: 'test-salon', type: 'advanced' })
    );

    await waitFor(() => {
      expect(fetchAdvancedReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    });

    expect(result.current.data.advancedReports).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('não carrega dados quando slug é null', async () => {
    const { result } = renderHook(() => useReportsData({ slug: null }));

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    expect(fetchBasicReports).not.toHaveBeenCalled();
    expect(fetchAdvancedReports).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.initialLoading).toBe(false);
  });

  it('aplica filtros corretamente', async () => {
    const mockData = { reports: [] };
    const filters = { startDate: '2024-01-01', endDate: '2024-01-31' };
    fetchBasicReports.mockResolvedValueOnce(mockData);

    renderHook(() =>
      useReportsData({
        slug: 'test-salon',
        type: 'basic',
        filters,
      })
    );

    await waitFor(() => {
      expect(fetchBasicReports).toHaveBeenCalledWith({
        slug: 'test-salon',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  it('marca forbidden em business quando endpoints retornam 403', async () => {
    const forbiddenError = { response: { status: 403 } };
    fetchTopServices.mockRejectedValueOnce(forbiddenError);
    fetchRevenue.mockRejectedValueOnce(forbiddenError);

    const { result } = renderHook(() =>
      useReportsData({
        slug: 'business-forbidden-salon',
        type: 'business',
      })
    );

    await waitFor(() => {
      expect(fetchTopServices).toHaveBeenCalledWith({
        slug: 'business-forbidden-salon',
        limit: 500,
        offset: 0,
      });
      expect(fetchRevenue).toHaveBeenCalledWith({
        slug: 'business-forbidden-salon',
        limit: 500,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.forbidden).toBe(true);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data.businessReports).toEqual({});
  });

  it('mantém os dados de top-services quando revenue falha (falha parcial não derruba tudo)', async () => {
    fetchTopServices.mockResolvedValueOnce([
      { service_id: 1, service_name: 'Coloração', qty: 12, revenue: 900 },
    ]);
    fetchRevenue.mockRejectedValueOnce({ response: { status: 500 } });

    const filters = { from: '2026-08-01', to: '2026-08-31', interval: 'day', limit: 25 };
    const { result } = renderHook(() =>
      useReportsData({
        slug: 'business-partial-fail',
        type: 'business',
        filters,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Regressão: antes da correção, uma falha isolada em /reports/revenue/
    // descartava também o resultado bem-sucedido de /reports/top-services/
    // (via `throw hasError` incondicional), fazendo o card "Serviços Mais
    // Populares" aparecer vazio mesmo com dados reais disponíveis.
    expect(result.current.data.businessReports.top_services).toEqual([
      { service_id: 1, service_name: 'Coloração', qty: 12, revenue: 900 },
    ]);
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('mantém os dados de revenue quando top-services falha (falha parcial não derruba tudo)', async () => {
    fetchTopServices.mockRejectedValueOnce({ response: { status: 500 } });
    fetchRevenue.mockResolvedValueOnce({
      interval: 'day',
      series: [{ period_start: '2026-08-01', revenue: 500 }],
    });

    const filters = { from: '2026-08-01', to: '2026-08-31', interval: 'day', limit: 25 };
    const { result } = renderHook(() =>
      useReportsData({
        slug: 'business-partial-fail-2',
        type: 'business',
        filters,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.businessReports.revenue).toEqual({
      interval: 'day',
      series: [{ period_start: '2026-08-01', revenue: 500 }],
    });
    expect(result.current.error).toBeNull();
  });

  it('propaga erro bloqueante quando top-services e revenue falham juntos', async () => {
    fetchTopServices.mockRejectedValueOnce({ response: { status: 500 } });
    fetchRevenue.mockRejectedValueOnce({ response: { status: 500 } });

    const filters = { from: '2026-08-01', to: '2026-08-31' };
    const { result } = renderHook(() =>
      useReportsData({
        slug: 'business-total-fail',
        type: 'business',
        filters,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.businessReports).toEqual({});
    expect(result.current.error).not.toBeNull();
  });

  it('carrega insights com retenção e período', async () => {
    const filters = { from: '2026-04-01', to: '2026-04-28' };
    const retentionData = {
      new_clients: { qty: 4, revenue: 120 },
      returning_clients: { qty: 2, revenue: 80 },
    };
    fetchRetention.mockResolvedValueOnce(retentionData);

    const { result } = renderHook(() =>
      useReportsData({
        slug: 'aurora',
        type: 'insights',
        filters,
      })
    );

    await waitFor(() => {
      expect(fetchRetention).toHaveBeenCalledWith({
        slug: 'aurora',
        ...filters,
      });
    });

    expect(result.current.data.insightsReports).toEqual({
      retention: retentionData,
      period: {
        start: '2026-04-01',
        end: '2026-04-28',
      },
    });
  });

  it('refetch ignora cache e consulta API novamente', async () => {
    fetchBasicReports.mockResolvedValue({ reports: [{ id: 1 }] });

    const { result } = renderHook(() =>
      useReportsData({ slug: 'cache-salon', type: 'basic' })
    );

    await waitFor(() => {
      expect(fetchBasicReports).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchBasicReports).toHaveBeenCalledTimes(2);
    });
  });
});
