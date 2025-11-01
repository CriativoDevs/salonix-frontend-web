import { renderHook, act } from '@testing-library/react';
import { useReportsData } from '../useReportsData';
import { fetchBasicReports, fetchAdvancedReports } from '../../api/reports';

// Mock das funções da API
jest.mock('../../api/reports', () => ({
  fetchBasicReports: jest.fn(),
  fetchAdvancedReports: jest.fn(),
}));

// Mock do parseApiError
jest.mock('../../utils/apiError', () => ({
  parseApiError: jest.fn((error, defaultMessage) => defaultMessage || error.message),
}));

describe('useReportsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega relatórios básicos com sucesso', async () => {
    const mockData = { reports: [{ id: 1, name: 'Test Report' }] };
    fetchBasicReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'basic' }));

    expect(result.current.initialLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(fetchBasicReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(result.current.data.basicReports).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('carrega relatórios avançados com sucesso', async () => {
    const mockData = { reports: [{ id: 2, name: 'Advanced Report' }] };
    fetchAdvancedReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'advanced' }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(fetchAdvancedReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(result.current.data.advancedReports).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('não carrega dados quando slug é null', async () => {
    const { result } = renderHook(() => useReportsData({ slug: null }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
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

    renderHook(() => useReportsData({ 
      slug: 'test-salon', 
      type: 'basic',
      filters 
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(fetchBasicReports).toHaveBeenCalledWith({ 
      slug: 'test-salon',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
  });
});