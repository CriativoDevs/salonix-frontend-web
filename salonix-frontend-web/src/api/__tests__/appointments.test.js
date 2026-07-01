/* eslint-env jest */

import client from '../client';
import {
  fetchAppointments,
  fetchAppointmentDetail,
  createAppointment,
  updateAppointment,
  createAppointmentsMixedBulk,
  importAppointmentsCSV,
  fetchAppointmentsImportTemplate,
  exportAppointmentsCSV,
} from '../appointments';
import {
  appointmentListResponse,
  appointmentListItem,
  appointmentDetail,
  appointmentPayload,
} from '../../tests/fixtures/appointments';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('appointments api', () => {
  it('fetchAppointments normalizes paginated payload including customer id', async () => {
    client.get.mockResolvedValueOnce({ data: appointmentListResponse });

    const data = await fetchAppointments();

    expect(client.get).toHaveBeenCalledWith('salon/appointments/', {
      headers: {},
      params: { page_size: 20, ordering: '-created_at' },
    });
    expect(data.results).toHaveLength(1);
    expect(data.results[0].customer).toBe(appointmentListItem.customer);
  });

  it('fetchAppointmentDetail retrieves extended info with customer block', async () => {
    client.get.mockResolvedValueOnce({ data: appointmentDetail });

    const data = await fetchAppointmentDetail(appointmentDetail.id);

    expect(client.get).toHaveBeenCalledWith(`appointments/${appointmentDetail.id}/`, {
      headers: {},
      params: {},
    });
    expect(data.customer).toEqual(appointmentDetail.customer);
  });

  it('createAppointment forwards payload including customer id', async () => {
    client.post.mockResolvedValueOnce({ data: { id: 33 } });

    await createAppointment(appointmentPayload);

    expect(client.post).toHaveBeenCalledWith('appointments/', appointmentPayload, {
      headers: {},
      params: {},
    });
  });

  it('updateAppointment patches resource within salon namespace', async () => {
    client.patch.mockResolvedValueOnce({ data: { id: appointmentListItem.id } });

    await updateAppointment(appointmentListItem.id, { status: 'completed' });

    expect(client.patch).toHaveBeenCalledWith(
      `salon/appointments/${appointmentListItem.id}/`,
      { status: 'completed' },
      { headers: {}, params: {} },
    );
  });

  it('createAppointmentsMixedBulk posts to mixed bulk endpoint', async () => {
    const payload = { items: [{ slot_id: 1, service_id: 2, professional_id: 3 }] };
    client.post.mockResolvedValueOnce({ data: { success: true, appointments_created: 1 } });

    const resp = await createAppointmentsMixedBulk(payload);

    expect(client.post).toHaveBeenCalledWith('appointments/bulk/mixed/', payload, {
      headers: {},
      params: {},
    });
    expect(resp.success).toBe(true);
  });

  it('importAppointmentsCSV posts the file as multipart with dry_run query param', async () => {
    const file = new File(['a,b\n1,2'], 'appointments.csv', { type: 'text/csv' });
    client.post.mockResolvedValueOnce({
      data: { entity: 'appointments', summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const resp = await importAppointmentsCSV(file, { dryRun: true, slug: 'salon-x' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe('import/appointments/');
    expect(body.get('file')).toBe(file);
    expect(config).toEqual({
      headers: { 'X-Tenant-Slug': 'salon-x', 'Content-Type': 'multipart/form-data' },
      params: { dry_run: 'true', tenant: 'salon-x' },
    });
    expect(resp.summary.created).toBe(1);
  });

  it('importAppointmentsCSV defaults dry_run to false when not provided', async () => {
    const file = new File(['a,b\n1,2'], 'appointments.csv', { type: 'text/csv' });
    client.post.mockResolvedValueOnce({ data: { summary: {} } });

    await importAppointmentsCSV(file);

    const [, , config] = client.post.mock.calls[0];
    expect(config.params.dry_run).toBe('false');
  });

  it('fetchAppointmentsImportTemplate downloads the CSV template as a blob', async () => {
    const blob = new Blob(['col1,col2']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await fetchAppointmentsImportTemplate({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('import/templates/appointments.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('exportAppointmentsCSV downloads the appointments export as a blob', async () => {
    const blob = new Blob(['id,status']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await exportAppointmentsCSV({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('salon/appointments/export/', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
