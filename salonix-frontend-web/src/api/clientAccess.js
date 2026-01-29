import client from './client';

// Helper para criar header Authorization com token de cliente
function getClientAuthHeaders() {
  const token = localStorage.getItem('client_access_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

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

export async function loginClient({ email, password, tenantSlug }) {
  const response = await client.post('clients/login/', {
    email,
    password,
    tenant_slug: tenantSlug,
  });
  return response.data;
}

export async function setClientPassword({ password }) {
  const response = await client.post(
    'clients/set-password/',
    { password },
    {
      headers: getClientAuthHeaders(),
    }
  );
  return response.data;
}
