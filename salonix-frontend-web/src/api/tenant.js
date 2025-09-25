import client from './client';

const TENANT_ENDPOINT = 'users/tenant/meta/';

export function fetchTenantMeta(slug, config = {}) {
  const params = { ...(config.params || {}) };
  if (slug) {
    // Backend espera query param 'tenant' (não 'slug')
    params.tenant = slug;
  }

  return client.get(TENANT_ENDPOINT, {
    ...config,
    params,
  });
}

export { TENANT_ENDPOINT };
