/* eslint-env jest */

import client from '../client';
import {
  importServicesCSV,
  fetchServicesImportTemplate,
  exportServicesCSV,
} from '../services';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('services import/export', () => {
  it('importServicesCSV posts the file as multipart with dry_run query param', async () => {
    const file = new File(['a,b\n1,2'], 'services.csv', { type: 'text/csv' });
    client.post.mockResolvedValueOnce({
      data: { summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const resp = await importServicesCSV(file, { dryRun: true, slug: 'salon-x' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe('import/services/');
    expect(body.get('file')).toBe(file);
    expect(config).toEqual({
      headers: { 'X-Tenant-Slug': 'salon-x', 'Content-Type': 'multipart/form-data' },
      params: { dry_run: 'true', tenant: 'salon-x' },
    });
    expect(resp.summary.created).toBe(1);
  });

  it('fetchServicesImportTemplate downloads the CSV template as a blob', async () => {
    const blob = new Blob(['name,price_eur,duration_minutes']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await fetchServicesImportTemplate({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('import/templates/services.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('exportServicesCSV downloads the services export as a blob', async () => {
    const blob = new Blob(['id,name']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await exportServicesCSV({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('export/services.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
