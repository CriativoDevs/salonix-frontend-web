import client from './client';

export async function requestClientAccessLinkPublic({
  tenantSlug,
  email,
  captchaBypassToken,
}) {
  const headers = {};
  if (captchaBypassToken) {
    headers['X-Captcha-Token'] = captchaBypassToken;
  }
  const payload = { email };
  if (tenantSlug) {
    payload.tenant_slug = tenantSlug;
  }
  const response = await client.post('public/clients/access-link/', payload, {
    headers,
  });
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

export async function loginClient({ email, password, tenantSlug }) {
  const response = await client.post('clients/login/', {
    email,
    password,
    tenant_slug: tenantSlug,
  });
  return response.data;
}

export async function setClientPassword({ password }) {
  const response = await client.post('clients/set-password/', { password });
  return response.data;
}
