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
  primaryColor,
  secondaryColor,
  logoFile,
  logoUrl,
}) {
  if (logoFile instanceof File) {
    const formData = new FormData();
    if (primaryColor) formData.append('primary_color', primaryColor);
    if (secondaryColor) formData.append('secondary_color', secondaryColor);
    formData.append('logo', logoFile);
    if (logoUrl && /^https?:\/\//i.test(logoUrl.trim())) {
      formData.append('logo_url', logoUrl.trim());
    }

    const response = await client.patch(TENANT_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const payload = {};
  if (primaryColor) payload.primary_color = primaryColor;
  if (secondaryColor) payload.secondary_color = secondaryColor;
  if (logoUrl && /^https?:\/\//i.test(logoUrl.trim())) {
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
