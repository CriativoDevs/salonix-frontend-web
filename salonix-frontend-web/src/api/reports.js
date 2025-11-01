import client from './client';

/**
 * Busca relatórios básicos (summary + overview)
 * Disponível para todos os planos com reports_enabled=true
 */
export async function fetchBasicReports(params = {}) {
  const { from, to, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;

  const response = await client.get('reports/basic/', {
    params: queryParams,
    headers
  });

  return response.data;
}

/**
 * Busca relatórios avançados (top services + revenue)
 * Disponível apenas para planos Pro e Enterprise
 */
export async function fetchAdvancedReports(params = {}) {
  const { from, to, limit, offset, interval, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (limit) queryParams.limit = limit;
  if (offset) queryParams.offset = offset;
  if (interval) queryParams.interval = interval; // day/week/month

  const { data } = await client.get('reports/advanced/', {
    headers,
    params: queryParams,
  });
  return data;
}

/**
 * Exporta relatórios básicos em CSV
 * Disponível para todos os planos com reports_enabled=true
 */
export async function exportBasicReportsCSV(params = {}) {
  const { from, to, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;

  const response = await client.get('reports/basic/export/', {
    headers,
    params: queryParams,
    responseType: 'blob',
  });
  return response;
}

/**
 * Exporta relatório de overview em CSV
 */
export async function exportOverviewReport(params = {}) {
  const { from, to, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;

  const response = await client.get('reports/overview/export/', {
    headers,
    params: queryParams,
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Exporta relatório de top services em CSV
 */
export async function exportTopServicesReport(params = {}) {
  const { from, to, limit, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (limit) queryParams.limit = limit;

  const response = await client.get('reports/top-services/export/', {
    headers,
    params: queryParams,
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Exporta relatório de revenue em CSV
 */
export async function exportRevenueReport(params = {}) {
  const { from, to, interval, slug } = params;
  const headers = {};
  const queryParams = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    queryParams.tenant = slug;
  }

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (interval) queryParams.interval = interval; // day/week/month

  const response = await client.get('reports/revenue/export/', {
    headers,
    params: queryParams,
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Utilitário para download de arquivo CSV
 */
export function downloadCSV(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
