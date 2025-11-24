/* eslint-env jest */

import client from '../client';
import {
  fetchAppointments,
  fetchAppointmentDetail,
  createAppointment,
  updateAppointment,
  createAppointmentsMixedBulk,
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
});
