import client from './client';

export async function login(email, password) {
  const response = await client.post('users/token/', {
    email,
    password,
  });
  return response.data; // Esperado: { access, refresh }
}

export async function refreshToken(refresh) {
  const response = await client.post('users/token/refresh/', {
    refresh,
  });
  return response.data; // Esperado: { access }
}
