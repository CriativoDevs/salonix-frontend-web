import client from './client';

export async function login(email, password, { captchaBypassToken } = {}) {
  const headers = {};
  if (captchaBypassToken) {
    headers['X-Captcha-Token'] = captchaBypassToken;
  }
  const response = await client.post(
    'users/token/',
    { email, password },
    { headers }
  );
  return response.data; // { access, refresh, tenant }
}

export async function refreshToken(refresh) {
  const response = await client.post('users/token/refresh/', {
    refresh,
  });
  return response.data; // { access }
}

export async function registerUser(payload, { captchaBypassToken } = {}) {
  const headers = {};
  if (captchaBypassToken) {
    headers['X-Captcha-Token'] = captchaBypassToken;
  }
  const response = await client.post('users/register/', payload, { headers });
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

export async function requestPasswordReset(email, resetUrl, captchaBypassToken) {
  const headers = {};
  if (captchaBypassToken) {
    headers['X-Captcha-Token'] = captchaBypassToken;
  }
  const response = await client.post(
    'users/password/reset/',
    { email, reset_url: resetUrl },
    { headers }
  );
  return response.data; // { status: 'ok' }
}

export async function confirmPasswordReset(uid, token, newPassword) {
  const response = await client.post('users/password/reset/confirm/', {
    uid,
    token,
    new_password: newPassword,
  });
  return response.data; // { status: 'password_updated' }
}
