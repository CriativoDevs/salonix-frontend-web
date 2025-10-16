/* eslint-env jest */

import client from '../client';
import {
  fetchDashboardOverview,
  fetchDashboardRevenueSeries,
  fetchDashboardBookings,
  fetchDashboardCustomers,
} from '../dashboard';

jest.mock('../client', () => ({
  get: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('dashboard api client', () => {
  it('fetchDashboardOverview inclui slug quando informado', async () => {
    client.get.mockResolvedValueOnce({ data: { appointments_total: 5 } });

    const payload = await fetchDashboardOverview({ slug: 'aurora' });

    expect(client.get).toHaveBeenCalledWith('reports/overview/', {
      headers: { 'X-Tenant-Slug': 'aurora' },
      params: { tenant: 'aurora' },
    });
    expect(payload.appointments_total).toBe(5);
  });

  it('fetchDashboardOverview funciona sem slug', async () => {
    client.get.mockResolvedValueOnce({ data: { revenue_total: 123 } });

    const payload = await fetchDashboardOverview();

    expect(client.get).toHaveBeenCalledWith('reports/overview/', {
      headers: {},
      params: {},
    });
    expect(payload.revenue_total).toBe(123);
  });

  it('fetchDashboardRevenueSeries envia intervalo padrão e slug', async () => {
    client.get.mockResolvedValueOnce({ data: { interval: 'month', series: [] } });

    const result = await fetchDashboardRevenueSeries({ slug: 'aurora' });

    expect(client.get).toHaveBeenCalledWith('reports/revenue/', {
      headers: { 'X-Tenant-Slug': 'aurora' },
      params: { interval: 'month', tenant: 'aurora' },
    });
    expect(result.interval).toBe('month');
  });

  it('fetchDashboardRevenueSeries aceita override de intervalo', async () => {
    client.get.mockResolvedValueOnce({ data: { interval: 'week', series: [] } });

    await fetchDashboardRevenueSeries({ interval: 'week' });

    expect(client.get).toHaveBeenCalledWith('reports/revenue/', {
      headers: {},
      params: { interval: 'week' },
    });
  });

  it('fetchDashboardBookings respeita filtros', async () => {
    client.get.mockResolvedValueOnce({ data: { results: [] } });

    await fetchDashboardBookings({ slug: 'aurora', params: { status: 'scheduled' } });

    expect(client.get).toHaveBeenCalledWith('salon/appointments/', {
      headers: { 'X-Tenant-Slug': 'aurora' },
      params: { status: 'scheduled', tenant: 'aurora' },
    });
  });

  it('fetchDashboardCustomers devolve payload da API', async () => {
    client.get.mockResolvedValueOnce({ data: { count: 12 } });

    const payload = await fetchDashboardCustomers({ params: { page_size: 10 } });

    expect(client.get).toHaveBeenCalledWith('salon/customers/', {
      headers: {},
      params: { page_size: 10 },
    });
    expect(payload.count).toBe(12);
  });
});
