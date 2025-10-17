import client from './client';

const extractRequestId = (headers) =>
  headers?.['x-request-id'] || headers?.['X-Request-ID'] || null;

const buildTenantParams = (slug) => {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  return { headers, params };
};

export async function fetchStaffMembers({ slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.get('users/staff/', { headers, params });
  const { data } = response;
  return {
    staff: Array.isArray(data) ? data : [],
    requestId: extractRequestId(response.headers),
  };
}

export async function inviteStaffMember(payload, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.post('users/staff/', payload, { headers, params });
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function updateStaffMember(id, payload, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.patch(`users/staff/`, { id, ...payload }, { headers, params });
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function disableStaffMember(id, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.delete('users/staff/', {
    headers,
    params,
    data: { id },
  });
  return {
    success: response.status === 204,
    requestId: extractRequestId(response.headers),
  };
}

export async function acceptStaffInvite(payload) {
  const response = await client.post('users/staff/accept/', payload);
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}
