import client from './client';

// CRUD de vouchers do tenant (BE-VOUCHER-01, #470) + atribuição a clientes
// (BE-VOUCHER-02, #471) e envio por e-mail (BE-VOUCHER-04, #473).
// Endpoints confirmados em salonix-backend/vouchers/{views,urls}.py.

function withTenantHeaders(slug) {
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  return headers;
}

export async function fetchVouchers({ slug } = {}) {
  const { data } = await client.get('vouchers/', {
    headers: withTenantHeaders(slug),
  });
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
}

export async function createVoucher(payload, { slug } = {}) {
  const { data } = await client.post('vouchers/', payload, {
    headers: withTenantHeaders(slug),
  });
  return data;
}

export async function updateVoucher(id, payload, { slug } = {}) {
  const { data } = await client.patch(`vouchers/${id}/`, payload, {
    headers: withTenantHeaders(slug),
  });
  return data;
}

export async function deleteVoucher(id, { slug } = {}) {
  const { status } = await client.delete(`vouchers/${id}/`, {
    headers: withTenantHeaders(slug),
  });
  return status === 204;
}

export async function assignVoucher(id, clientId, { slug } = {}) {
  const { data } = await client.post(
    `vouchers/${id}/assign/`,
    { client_id: clientId },
    { headers: withTenantHeaders(slug) }
  );
  return data;
}

// Atribuição em massa (BE-VOUCHER-07, #575) — retorna
// { assigned: [ClientVoucher, ...], skipped: [{ client_id, reason }] }.
export async function assignVoucherBulk(id, clientIds, { slug } = {}) {
  const { data } = await client.post(
    `vouchers/${id}/assign-bulk/`,
    { client_ids: clientIds },
    { headers: withTenantHeaders(slug) }
  );
  return data;
}

export async function sendVoucherEmail(id, clientId, { slug } = {}) {
  const { data } = await client.post(
    `vouchers/${id}/send-email/`,
    { client_id: clientId },
    { headers: withTenantHeaders(slug) }
  );
  return data;
}

// Vouchers atribuídos a um cliente (visão do tenant), usado no perfil do
// cliente — GET /api/salon/customers/{id}/vouchers/ (BE-VOUCHER-02, #471).
export async function fetchCustomerVouchers(customerId, { slug } = {}) {
  const { data } = await client.get(`salon/customers/${customerId}/vouchers/`, {
    headers: withTenantHeaders(slug),
  });
  return Array.isArray(data) ? data : [];
}
