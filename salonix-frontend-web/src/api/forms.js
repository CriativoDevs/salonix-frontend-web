import client from './client';

// Fichas customizáveis do tenant (BE-ANAMNESE-01).
// Endpoints confirmados em salonix-backend/core/urls.py:
//   salon/forms/            CRUD das fichas (leitura: staff; escrita: owner/manager)
//   salon/form-responses/   respostas por cliente (filtros ?customer= e ?form=)

function withTenantHeaders(slug) {
  const headers = {};
  if (slug) headers['X-Tenant-Slug'] = slug;
  return headers;
}

const toList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

export async function fetchForms({ slug } = {}) {
  const { data } = await client.get('salon/forms/', {
    headers: withTenantHeaders(slug),
  });
  return toList(data);
}

export async function createForm(payload, { slug } = {}) {
  const { data } = await client.post('salon/forms/', payload, {
    headers: withTenantHeaders(slug),
  });
  return data;
}

export async function updateForm(id, payload, { slug } = {}) {
  const { data } = await client.patch(`salon/forms/${id}/`, payload, {
    headers: withTenantHeaders(slug),
  });
  return data;
}

export async function deleteForm(id, { slug } = {}) {
  const { status } = await client.delete(`salon/forms/${id}/`, {
    headers: withTenantHeaders(slug),
  });
  return status === 204;
}

export async function fetchCustomerFormResponses(customerId, { slug } = {}) {
  const { data } = await client.get('salon/form-responses/', {
    headers: withTenantHeaders(slug),
    params: { customer: customerId },
  });
  return toList(data);
}

// answers: [{ field_id, value }]. Cria a resposta da ficha para o cliente.
export async function createFormResponse(
  { form, customer, answers },
  { slug } = {}
) {
  const { data } = await client.post(
    'salon/form-responses/',
    { form, customer, answers },
    { headers: withTenantHeaders(slug) }
  );
  return data;
}

// Atualiza respostas já existentes (form e customer são imutáveis no BE).
export async function updateFormResponse(id, { answers }, { slug } = {}) {
  const { data } = await client.patch(
    `salon/form-responses/${id}/`,
    { answers },
    { headers: withTenantHeaders(slug) }
  );
  return data;
}
