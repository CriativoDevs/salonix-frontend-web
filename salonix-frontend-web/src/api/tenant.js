import client from './client';

const TENANT_ENDPOINT = 'users/tenant/meta/';

export function fetchTenantMeta(slug, config = {}) {
  const params = { ...(config.params || {}) };
  if (slug) {
    params.tenant = slug;
  }

  return client.get(TENANT_ENDPOINT, {
    ...config,
    params,
  });
}

export async function updateTenantBranding({
  logoFile,
  logoUrl,
}) {
  const validUrl = typeof logoUrl === 'string' && /^https?:\/\//i.test(logoUrl.trim());

  // Bloqueia envio simultâneo de arquivo e URL
  if (logoFile instanceof File && validUrl) {
    throw new Error('Selecione arquivo OU URL de logo, não ambos.');
  }

  if (logoFile instanceof File) {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await client.patch(TENANT_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const payload = {};
  if (validUrl) {
    payload.logo_url = logoUrl.trim();
  }

  const response = await client.patch(TENANT_ENDPOINT, payload);
  return response.data;
}

export async function updateTenantAutoInvite(autoInviteEnabled) {
  const response = await client.patch(TENANT_ENDPOINT, {
    auto_invite_enabled: Boolean(autoInviteEnabled),
  });
  return response.data;
}

export { TENANT_ENDPOINT };
