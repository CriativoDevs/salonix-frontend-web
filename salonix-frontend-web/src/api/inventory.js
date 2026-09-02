import client from './client';

function buildHeadersAndParams({ slug, params } = {}) {
  const headers = {};
  const searchParams = { ...(params || {}) };
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    searchParams.tenant = slug;
  }
  return { headers, params: searchParams };
}

export async function fetchInventoryItems({ slug, params } = {}) {
  const { headers, params: searchParams } = buildHeadersAndParams({
    slug,
    params,
  });
  const { data } = await client.get('inventory/items/', {
    headers,
    params: searchParams,
  });
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
}

export async function createInventoryItem(payload, { slug } = {}) {
  const { headers, params } = buildHeadersAndParams({ slug });
  const body = {
    name: String(payload?.name || '').trim(),
    unit: String(payload?.unit || '').trim(),
    quantity:
      payload?.quantity != null && payload?.quantity !== ''
        ? Number(payload.quantity)
        : 0,
    minimum_quantity:
      payload?.minimum_quantity != null && payload?.minimum_quantity !== ''
        ? Number(payload.minimum_quantity)
        : null,
  };
  const { data } = await client.post('inventory/items/', body, {
    headers,
    params,
  });
  return data;
}

export async function updateInventoryItem(id, payload, { slug } = {}) {
  const { headers, params } = buildHeadersAndParams({ slug });
  const body = {};
  if (payload?.name != null) body.name = String(payload.name).trim();
  if (payload?.unit != null) body.unit = String(payload.unit).trim();
  if (payload?.quantity != null && payload.quantity !== '') {
    body.quantity = Number(payload.quantity);
  }
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'minimum_quantity')) {
    body.minimum_quantity =
      payload.minimum_quantity != null && payload.minimum_quantity !== ''
        ? Number(payload.minimum_quantity)
        : null;
  }
  const { data } = await client.patch(`inventory/items/${id}/`, body, {
    headers,
    params,
  });
  return data;
}

export async function deleteInventoryItem(id, { slug } = {}) {
  const { headers, params } = buildHeadersAndParams({ slug });
  const { status } = await client.delete(`inventory/items/${id}/`, {
    headers,
    params,
  });
  return status === 204;
}

export async function createStockMovement(payload, { slug } = {}) {
  const { headers, params } = buildHeadersAndParams({ slug });
  const body = {
    item: payload?.item,
    movement_type: payload?.movement_type,
    quantity:
      payload?.quantity != null && payload?.quantity !== ''
        ? Number(payload.quantity)
        : 0,
    notes: payload?.notes ? String(payload.notes).trim() : '',
  };
  const { data } = await client.post('inventory/movements/', body, {
    headers,
    params,
  });
  return data;
}

export async function fetchStockMovements({ slug, params } = {}) {
  const { headers, params: searchParams } = buildHeadersAndParams({
    slug,
    params,
  });
  const { data } = await client.get('inventory/movements/', {
    headers,
    params: searchParams,
  });
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
}
