import { renderHook, act } from '@testing-library/react';
import { useReportsData } from '../useReportsData';
import { fetchBasicReports, fetchAdvancedReports } from '../../api/reports';

jest.mock('../../api/reports', () => ({
  fetchBasicReports: jest.fn(),
  fetchAdvancedReports: jest.fn(),
}));

describe('useReportsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega relatórios básicos com sucesso', async () => {
    const mockData = { reports: [{ id: 1, name: 'Test Report' }] };
    fetchBasicReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'basic' }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchBasicReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(result.current.loading).toBe(false);
    expect(result.current.data.basicReports).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('carrega relatórios avançados com sucesso', async () => {
    const mockData = { reports: [{ id: 2, name: 'Advanced Report' }] };
    fetchAdvancedReports.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'advanced' }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchAdvancedReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(result.current.loading).toBe(false);
    expect(result.current.data.advancedReports).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('marca forbidden quando API retorna 403', async () => {
    fetchBasicReports.mockRejectedValueOnce({
      response: { status: 403 }
    });

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'basic' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.forbidden).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('trata erro genérico corretamente', async () => {
    const mockError = new Error('Network error');
    fetchBasicReports.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon', type: 'basic' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.forbidden).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('não carrega dados quando slug é null', async () => {
    const { result } = renderHook(() => useReportsData({ slug: null }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(fetchBasicReports).not.toHaveBeenCalled();
    expect(fetchAdvancedReports).not.toHaveBeenCalled();
  });

  it('carrega ambos os tipos quando type não é especificado', async () => {
    const basicData = { reports: [{ id: 1, type: 'basic' }] };
    const advancedData = { reports: [{ id: 2, type: 'advanced' }] };
    
    fetchBasicReports.mockResolvedValueOnce(basicData);
    fetchAdvancedReports.mockResolvedValueOnce(advancedData);

    // Não especificar type para carregar ambos
    const { result } = renderHook(() => useReportsData({ slug: 'test-salon' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchBasicReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(fetchAdvancedReports).toHaveBeenCalledWith({ slug: 'test-salon' });
    expect(result.current.data.basicReports).toEqual(basicData);
    expect(result.current.data.advancedReports).toEqual(advancedData);
  });

  it('marca forbidden quando um dos tipos retorna 403', async () => {
    const basicData = { reports: [{ id: 1, type: 'basic' }] };
    const forbiddenError = { response: { status: 403 } };
    
    fetchBasicReports.mockResolvedValueOnce(basicData);
    fetchAdvancedReports.mockRejectedValueOnce(forbiddenError);

    const { result } = renderHook(() => useReportsData({ slug: 'test-salon' }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.forbidden).toBe(true);
    expect(result.current.data.basicReports).toEqual(basicData);
    expect(result.current.data.advancedReports).toBeNull();
  });
});