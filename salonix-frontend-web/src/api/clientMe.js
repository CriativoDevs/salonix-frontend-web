import client from './client';

export async function fetchClientProfile() {
  const { data } = await client.get('clients/me/profile/');
  return data;
}

export async function updateClientProfile(partial) {
  const { data } = await client.patch('clients/me/profile/', partial);
  return data;
}

export async function updateClientProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await client.patch('clients/me/profile/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

const PAGE_SIZE = 20;

function normalizePage(data) {
  if (Array.isArray(data)) {
    // Compatibilidade: formato antigo (array simples), caso algum
    // ambiente ainda não tenha o backend atualizado.
    return { results: data, hasMore: false };
  }
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    hasMore: Boolean(data?.has_more),
  };
}

export async function fetchClientUpcoming({ offset = 0, limit = PAGE_SIZE } = {}) {
  const { data } = await client.get('clients/me/appointments/upcoming/', {
    params: { offset, limit },
  });
  return normalizePage(data);
}

export async function fetchClientHistory({ offset = 0, limit = PAGE_SIZE } = {}) {
  const { data } = await client.get('clients/me/appointments/history/', {
    params: { offset, limit },
  });
  return normalizePage(data);
}

export async function cancelClientAppointment(id) {
  const { data } = await client.patch(
    `clients/me/appointments/${id}/cancel/`,
    {}
  );
  return data;
}

export async function createClientAppointment(payload) {
  const { data } = await client.post('clients/me/appointments/', payload);
  return data;
}
