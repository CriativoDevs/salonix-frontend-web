import client from './client';

function buildHeaders({ slug } = {}) {
  const headers = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  return headers;
}

export async function fetchMarketingCampaigns({ slug } = {}) {
  const headers = buildHeaders({ slug });
  const { data } = await client.get('notifications/marketing-campaigns/', {
    headers,
  });
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];
}

export async function createMarketingCampaign(payload, { slug } = {}) {
  const headers = buildHeaders({ slug });
  const body = {
    subject: String(payload?.subject || '').trim(),
    body: String(payload?.body || '').trim(),
  };
  const replyTo = payload?.reply_to ? String(payload.reply_to).trim() : '';
  if (replyTo) {
    body.reply_to = replyTo;
  }
  const { data } = await client.post(
    'notifications/marketing-campaigns/',
    body,
    { headers }
  );
  return data;
}

export default { fetchMarketingCampaigns, createMarketingCampaign };
