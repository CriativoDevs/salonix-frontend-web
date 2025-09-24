import client from './client';

export async function login(email, password) {
  const response = await client.post('users/token/', {
    email,
    password,
  });
  return response.data; // { access, refresh, tenant }
}

export async function refreshToken(refresh) {
  const response = await client.post('users/token/refresh/', {
    refresh,
  });
  return response.data; // { access }
}

export async function registerUser(payload) {
  const response = await client.post('users/register/', payload);
  return response.data;
}

export async function fetchFeatureFlags() {
  const response = await client.get('users/me/features/');
  return response.data;
}

export async function fetchTenantBootstrap() {
  const response = await client.get('users/me/tenant/');
  return response.data;
}
