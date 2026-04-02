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

const isFileLike = (value) =>
  typeof File !== 'undefined' && value instanceof File;

const buildInvitePayload = (payload = {}) => {
  if (!Object.values(payload).some(isFileLike)) {
    return { data: payload, isMultipart: false };
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, '');
      return;
    }
    formData.append(key, value);
  });

  return { data: formData, isMultipart: true };
};

const buildContactPayload = (id, payload = {}) => {
  const values = { id, ...payload };

  if (!Object.values(payload).some(isFileLike)) {
    return { data: values, isMultipart: false };
  }

  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, '');
      return;
    }
    formData.append(key, value);
  });

  return { data: formData, isMultipart: true };
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
  const { data, isMultipart } = buildInvitePayload(payload);
  const response = await client.post('users/staff/', data, {
    headers: isMultipart
      ? { ...headers, 'Content-Type': 'multipart/form-data' }
      : headers,
    params,
  });
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function updateStaffMember(id, payload, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.patch(
    `users/staff/`,
    { id, ...payload },
    { headers, params }
  );
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function resendStaffInvite(id, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.post(
    'users/staff/resend/',
    { id },
    { headers, params }
  );
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function sendStaffAccessLink(id, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const response = await client.post(
    'users/staff/access-link/',
    { id },
    { headers, params }
  );
  return {
    staffMember: response.data,
    requestId: extractRequestId(response.headers),
  };
}

export async function updateStaffContact(id, payload = {}, { slug } = {}) {
  const { headers, params } = buildTenantParams(slug);
  const { data, isMultipart } = buildContactPayload(id, payload);
  const response = await client.patch('users/staff/contact/', data, {
    headers: isMultipart
      ? { ...headers, 'Content-Type': 'multipart/form-data' }
      : headers,
    params,
  });
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
