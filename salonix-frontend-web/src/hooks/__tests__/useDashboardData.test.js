import { renderHook, act } from '@testing-library/react';
import useDashboardData from '../useDashboardData';
import {
  fetchDashboardOverview,
  fetchDashboardRevenueSeries,
  fetchDashboardBookings,
  fetchDashboardCustomers,
} from '../../api/dashboard';

jest.mock('../../api/dashboard', () => ({
  fetchDashboardOverview: jest.fn(),
  fetchDashboardRevenueSeries: jest.fn(),
  fetchDashboardBookings: jest.fn(),
  fetchDashboardCustomers: jest.fn(),
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega dados com slug e reports habilitados', async () => {
    fetchDashboardCustomers.mockResolvedValueOnce({ count: 12 });
    fetchDashboardBookings.mockResolvedValueOnce({ count: 5, results: [] });
    fetchDashboardOverview
      .mockResolvedValueOnce({
        appointments_total: 10,
        appointments_completed: 7,
        revenue_total: 1200,
        avg_ticket: 171,
      })
      .mockResolvedValueOnce({
        appointments_total: 45,
        appointments_completed: 32,
        revenue_total: 5400,
        avg_ticket: 168,
      });
    fetchDashboardRevenueSeries.mockResolvedValueOnce({ interval: 'month', series: [] });

    const { result } = renderHook(() =>
      useDashboardData({ slug: 'aurora', reportsEnabled: true, planTier: 'standard' })
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.reportsForbidden).toBe(false);
    expect(result.current.data.overviewDaily).toEqual({
      appointments_total: 10,
      appointments_completed: 7,
      revenue_total: 1200,
      avg_ticket: 171,
    });
    expect(result.current.data.overviewMonthly).toEqual({
      appointments_total: 45,
      appointments_completed: 32,
      revenue_total: 5400,
      avg_ticket: 168,
    });
    expect(result.current.data.customers).toEqual({ count: 12 });
    expect(result.current.data.bookings).toEqual({ count: 5, results: [] });
    expect(fetchDashboardOverview).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        slug: 'aurora',
        params: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      })
    );
    expect(fetchDashboardOverview).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        slug: 'aurora',
        params: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      })
    );
    expect(fetchDashboardRevenueSeries).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'aurora',
        interval: 'month',
        params: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      })
    );
  });

  it('marca reportsForbidden quando overview retorna 403', async () => {
    fetchDashboardCustomers.mockResolvedValueOnce({ count: 0 });
    fetchDashboardBookings.mockResolvedValueOnce({ count: 0, results: [] });
    fetchDashboardOverview
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockResolvedValueOnce({
        appointments_total: 0,
        appointments_completed: 0,
        revenue_total: 0,
        avg_ticket: 0,
      });
    fetchDashboardRevenueSeries.mockResolvedValueOnce({ interval: 'month', series: [] });

    const { result } = renderHook(() => useDashboardData({ slug: 'aurora', reportsEnabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.reportsForbidden).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('registra erro ao falhar em clientes', async () => {
    fetchDashboardCustomers.mockRejectedValueOnce(new Error('boom'));
    fetchDashboardBookings.mockResolvedValueOnce({ count: 0, results: [] });
    fetchDashboardOverview
      .mockResolvedValueOnce({
        appointments_total: 0,
        appointments_completed: 0,
        revenue_total: 0,
        avg_ticket: 0,
      })
      .mockResolvedValueOnce({
        appointments_total: 0,
        appointments_completed: 0,
        revenue_total: 0,
        avg_ticket: 0,
      });
    fetchDashboardRevenueSeries.mockResolvedValueOnce({ interval: 'month', series: [] });

    const { result } = renderHook(() => useDashboardData({ slug: 'aurora', reportsEnabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.reportsForbidden).toBe(false);
  });

  it('ignora carregamento quando slug ausente', async () => {
    const { result } = renderHook(() => useDashboardData({ slug: null }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(fetchDashboardCustomers).not.toHaveBeenCalled();
  });
});
