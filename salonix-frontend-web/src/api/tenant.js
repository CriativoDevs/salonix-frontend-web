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
  addressStreet,
  addressNumber,
  addressComplement,
  addressNeighborhood,
  addressCity,
  addressState,
  addressZip,
  addressCountry,
}) {
  const validUrl =
    typeof logoUrl === 'string' && /^https?:\/\//i.test(logoUrl.trim());

  // Bloqueia envio simultâneo de arquivo e URL
  if (logoFile instanceof File && validUrl) {
    throw new Error('Selecione arquivo OU URL de logo, não ambos.');
  }

  if (logoFile instanceof File) {
    const formData = new FormData();
    formData.append('logo', logoFile);
    if (typeof addressStreet === 'string')
      formData.append('address_street', addressStreet);
    if (typeof addressNumber === 'string')
      formData.append('address_number', addressNumber);
    if (typeof addressComplement === 'string')
      formData.append('address_complement', addressComplement);
    if (typeof addressNeighborhood === 'string')
      formData.append('address_neighborhood', addressNeighborhood);
    if (typeof addressCity === 'string')
      formData.append('address_city', addressCity);
    if (typeof addressState === 'string')
      formData.append('address_state', addressState);
    if (typeof addressZip === 'string')
      formData.append('address_zip', addressZip);
    if (typeof addressCountry === 'string')
      formData.append('address_country', addressCountry);

    const response = await client.patch(TENANT_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const payload = {};
  if (validUrl) {
    payload.logo_url = logoUrl.trim();
  }
  if (typeof addressStreet === 'string') payload.address_street = addressStreet;
  if (typeof addressNumber === 'string') payload.address_number = addressNumber;
  if (typeof addressComplement === 'string')
    payload.address_complement = addressComplement;
  if (typeof addressNeighborhood === 'string')
    payload.address_neighborhood = addressNeighborhood;
  if (typeof addressCity === 'string') payload.address_city = addressCity;
  if (typeof addressState === 'string') payload.address_state = addressState;
  if (typeof addressZip === 'string') payload.address_zip = addressZip;
  if (typeof addressCountry === 'string')
    payload.address_country = addressCountry;

  const response = await client.patch(TENANT_ENDPOINT, payload);
  return response.data;
}

export async function updateTenantAutoInvite(autoInviteEnabled) {
  const response = await client.patch(TENANT_ENDPOINT, {
    auto_invite_enabled: Boolean(autoInviteEnabled),
  });
  return response.data;
}

export async function updateTenantModules({ pwaClientEnabled }) {
  const response = await client.patch('users/tenant/modules/', {
    pwa_client_enabled: Boolean(pwaClientEnabled),
  });
  return response.data;
}

export async function updateTenantContact({ email, phone, phone_number }) {
  const payload = {};
  if (typeof email === 'string') payload.email = email;
  const phoneValue =
    typeof phone === 'string'
      ? phone
      : typeof phone_number === 'string'
        ? phone_number
        : undefined;
  if (typeof phoneValue === 'string') payload.phone = phoneValue;
  const response = await client.patch('users/tenant/profile/', payload);
  return response.data;
}

export { TENANT_ENDPOINT };
