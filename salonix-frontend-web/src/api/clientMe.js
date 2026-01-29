import client from './client';
import { getClientAccessToken } from '../utils/clientAuthStorage';

// Helper para criar header Authorization com token de cliente
function getClientAuthHeaders() {
  const token = getClientAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchClientProfile() {
  const { data } = await client.get('clients/me/profile/', {
    headers: getClientAuthHeaders(),
  });
  return data;
}

export async function updateClientProfile(partial) {
  const { data } = await client.patch('clients/me/profile/', partial, {
    headers: getClientAuthHeaders(),
  });
  return data;
}

export async function fetchClientUpcoming() {
  const { data } = await client.get('clients/me/appointments/upcoming/', {
    headers: getClientAuthHeaders(),
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchClientHistory() {
  const { data } = await client.get('clients/me/appointments/history/', {
    headers: getClientAuthHeaders(),
  });
  return Array.isArray(data) ? data : [];
}

export async function cancelClientAppointment(id) {
  const { data } = await client.patch(
    `clients/me/appointments/${id}/cancel/`,
    {},
    {
      headers: getClientAuthHeaders(),
    }
  );
  return data;
}

export async function createClientAppointment(payload) {
  const { data } = await client.post('clients/me/appointments/', payload, {
    headers: getClientAuthHeaders(),
  });
  return data;
}
