import client from './client';

export async function fetchClientProfile() {
  const { data } = await client.get('clients/me/profile/');
  return data;
}

export async function updateClientProfile(partial) {
  const { data } = await client.patch('clients/me/profile/', partial);
  return data;
}

export async function fetchClientUpcoming() {
  const { data } = await client.get('clients/me/appointments/upcoming/');
  return Array.isArray(data) ? data : [];
}

export async function fetchClientHistory() {
  const { data } = await client.get('clients/me/appointments/history/');
  return Array.isArray(data) ? data : [];
}

export async function cancelClientAppointment(id) {
  const { data } = await client.patch(`clients/me/appointments/${id}/cancel/`, {});
  return data;
}

