import client from '../client';
import {
  fetchTopServices,
  fetchRevenue,
  fetchRetention,
  exportTopServicesReport,
} from '../reports';

jest.mock('../client', () => ({
  get: jest.fn(),
}));

describe('api/reports — filtros de profissional/serviço', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    client.get.mockResolvedValue({ data: {}, headers: {} });
  });

  it('fetchTopServices envia professional_id e service_id quando informados', async () => {
    await fetchTopServices({
      slug: 'aurora',
      from: '2026-09-01',
      to: '2026-09-30',
      professional_id: '7',
      service_id: '9',
    });

    expect(client.get).toHaveBeenCalledWith(
      'reports/top-services/',
      expect.objectContaining({
        params: expect.objectContaining({
          professional_id: '7',
          service_id: '9',
        }),
      })
    );
  });

  it('fetchTopServices não envia professional_id/service_id quando omitidos', async () => {
    await fetchTopServices({ slug: 'aurora', from: '2026-09-01', to: '2026-09-30' });

    const [, options] = client.get.mock.calls[0];
    expect(options.params).not.toHaveProperty('professional_id');
    expect(options.params).not.toHaveProperty('service_id');
  });

  it('fetchTopServices não envia professional_id/service_id quando vêm como undefined (dropdowns em "Todos")', async () => {
    // Reflete exatamente o shape produzido por Reports.jsx quando os selects
    // de Profissional/Serviço estão no estado padrão ("Todos"):
    // `businessProfessionalId || undefined` / `businessServiceId || undefined`.
    await fetchTopServices({
      slug: 'aurora',
      from: '2026-08-01',
      to: '2026-08-31',
      limit: 25,
      professional_id: undefined,
      service_id: undefined,
    });

    const [, options] = client.get.mock.calls[0];
    expect(options.params).not.toHaveProperty('professional_id');
    expect(options.params).not.toHaveProperty('service_id');
    expect(options.params).toEqual(
      expect.objectContaining({
        tenant: 'aurora',
        from: '2026-08-01',
        to: '2026-08-31',
        limit: 25,
      })
    );
  });

  it('exportTopServicesReport envia professional_id e service_id quando informados', async () => {
    await exportTopServicesReport({
      slug: 'aurora',
      from: '2026-09-01',
      to: '2026-09-30',
      professional_id: '7',
      service_id: '9',
    });

    expect(client.get).toHaveBeenCalledWith(
      'reports/top-services/export/',
      expect.objectContaining({
        params: expect.objectContaining({
          professional_id: '7',
          service_id: '9',
        }),
      })
    );
  });

  it('fetchRetention envia professional_id quando informado', async () => {
    await fetchRetention({
      slug: 'aurora',
      from: '2026-09-01',
      to: '2026-09-30',
      professional_id: '7',
    });

    expect(client.get).toHaveBeenCalledWith(
      'reports/retention/',
      expect.objectContaining({
        params: expect.objectContaining({ professional_id: '7' }),
      })
    );
  });

  it('fetchRevenue nunca envia professional_id/service_id (endpoint não suporta)', async () => {
    await fetchRevenue({
      slug: 'aurora',
      from: '2026-09-01',
      to: '2026-09-30',
      interval: 'day',
      professional_id: '7',
      service_id: '9',
    });

    const [, options] = client.get.mock.calls[0];
    expect(options.params).not.toHaveProperty('professional_id');
    expect(options.params).not.toHaveProperty('service_id');
  });
});
