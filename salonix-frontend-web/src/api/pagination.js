// Util para extrair metadados de paginação dos headers

function parseIntSafe(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function extractOffsetFromUrl(url) {
  try {
    const u = new URL(url, 'http://localhost');
    const off = u.searchParams.get('offset');
    return off != null ? parseIntSafe(off, null) : null;
  } catch {
    return null;
  }
}

function parseLinkHeader(linkHeader) {
  if (!linkHeader || typeof linkHeader !== 'string') return { next: null, prev: null };
  const parts = linkHeader.split(',');
  let next = null;
  let prev = null;
  for (const p of parts) {
    const match = p.match(/<([^>]+)>;\s*rel="(next|prev)"/i);
    if (match) {
      const url = match[1];
      const rel = match[2].toLowerCase();
      if (rel === 'next') next = url;
      if (rel === 'prev') prev = url;
    }
  }
  return { next, prev };
}

export function parsePaginationHeaders(headers = {}) {
  const h = headers || {};
  const totalCount = parseIntSafe(h['x-total-count'], null);
  const limit = parseIntSafe(h['x-limit'], null);
  const offset = parseIntSafe(h['x-offset'], null);
  const { next, prev } = parseLinkHeader(h['link'] || h['Link']);
  const nextOffset = next != null ? extractOffsetFromUrl(next) : null;
  const prevOffset = prev != null ? extractOffsetFromUrl(prev) : null;

  return {
    totalCount,
    limit,
    offset,
    nextOffset,
    prevOffset,
    links: { next, prev },
  };
}

export default {
  parsePaginationHeaders,
};