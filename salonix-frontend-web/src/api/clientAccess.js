import client from './client';

export async function requestClientAccessLinkPublic({ tenantSlug, email, captchaBypassToken }) {
  const headers = {};
  if (captchaBypassToken) {
    headers['X-Captcha-Token'] = captchaBypassToken;
  }
  const payload = { email };
  if (tenantSlug) {
    payload.tenant_slug = tenantSlug;
  }
  const response = await client.post('public/clients/access-link/', payload, { headers });
  return response.data;
}

export async function acceptClientAccessToken({ token }) {
  const response = await client.post('clients/access-accept/', { token });
  return response.data;
}

export async function refreshClientSession() {
  const response = await client.post('clients/session/refresh/', {});
  return response.data;
}
