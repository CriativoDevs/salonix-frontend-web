/* eslint-env jest */

import {
  DEFAULT_TENANT_META,
  DEFAULT_TENANT_SLUG,
  extractSlugFromHost,
  extractSlugFromQuery,
  mergeTenantMeta,
  resolveTenantSlug,
  sanitizeTenantSlug,
} from '../tenant';

describe('sanitizeTenantSlug', () => {
  it('normalises mixed-case and spaces', () => {
    expect(sanitizeTenantSlug('  AuroraSpa  ')).toBe('auroraspa');
  });

  it('removes invalid characters', () => {
    expect(sanitizeTenantSlug('Glow & Shine!')).toBe('glow-shine');
  });

  it('returns empty string for invalid input', () => {
    expect(sanitizeTenantSlug(null)).toBe('');
    expect(sanitizeTenantSlug('')).toBe('');
  });
});

describe('extractSlugFromQuery', () => {
  it('returns slug when tenant query exists', () => {
    expect(extractSlugFromQuery('?tenant=aurora-pro')).toBe('aurora-pro');
  });

  it('handles search strings without leading question mark', () => {
    expect(extractSlugFromQuery('tenant=beauty-hub')).toBe('beauty-hub');
  });

  it('returns empty string when query is missing', () => {
    expect(extractSlugFromQuery('?other=param')).toBe('');
  });
});

describe('extractSlugFromHost', () => {
  it('returns subdomain for production-like hostnames', () => {
    expect(extractSlugFromHost('aurora.timelyone.app')).toBe('aurora');
  });

  it('ignores www prefix', () => {
    expect(extractSlugFromHost('www.timelyone.app')).toBe('');
  });

  it('supports localhost multitenancy', () => {
    expect(extractSlugFromHost('aurora.localhost')).toBe('aurora');
  });

  it('returns empty for bare localhost', () => {
    expect(extractSlugFromHost('localhost')).toBe('');
  });
});

describe('resolveTenantSlug', () => {
  it('prefers slug from query string', () => {
    const slug = resolveTenantSlug({ search: '?tenant=prime-beauty', hostname: 'aurora.localhost' });
    expect(slug).toBe('prime-beauty');
  });

  it('falls back to hostname slug when query missing', () => {
    const slug = resolveTenantSlug({ hostname: 'glow.timelyone.dev', defaultSlug: 'fallback' });
    expect(slug).toBe('glow');
  });

  it('uses provided default when nothing else available', () => {
    const slug = resolveTenantSlug({ search: '?foo=bar', hostname: 'localhost', defaultSlug: 'aurora' });
    expect(slug).toBe('aurora');
  });

  it('falls back to DEFAULT_TENANT_SLUG when no hints', () => {
    const slug = resolveTenantSlug({ search: '', hostname: '' });
    expect(slug).toBe(DEFAULT_TENANT_SLUG);
  });
});

describe('mergeTenantMeta', () => {
  it('fills missing fields with defaults', () => {
    const meta = mergeTenantMeta({ name: 'Aurora', plan: { code: 'premium' } }, 'aurora');
    expect(meta.slug).toBe('aurora');
    expect(meta.plan.code).toBe('premium');
    expect(meta.theme.primary).toBeDefined();
    expect(meta.flags.enableReports).toBe(false);
  });

  it('returns defaults when payload is invalid', () => {
    const meta = mergeTenantMeta(null, 'aurora');
    expect(meta).toEqual({ ...DEFAULT_TENANT_META, slug: 'aurora' });
  });

  it('normalises plan code', () => {
    const meta = mergeTenantMeta({ plan: { code: 'Pro Plus' } });
    expect(meta.plan.code).toBe('pro-plus');
  });

  it('propagates auto invite flag when provided', () => {
    const meta = mergeTenantMeta({ auto_invite_enabled: true }, 'aurora');
    expect(meta.auto_invite_enabled).toBe(true);
  });

  it('correctly merges nested feature flags from backend', () => {
    const raw = {
      slug: 'test',
      feature_flags: {
        modules: { reports_enabled: true },
        notifications: { sms: true },
      },
    };
    const meta = mergeTenantMeta(raw, 'test');
    expect(meta.flags.enableReports).toBe(true);
    expect(meta.flags.enableSms).toBe(true);
  });
});
