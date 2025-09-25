import { getEnvVar } from './env';

const runtimeDefaultSlug = (() => {
  if (typeof globalThis !== 'undefined') {
    const globalSlug = globalThis.__DEFAULT_TENANT_SLUG__;
    if (typeof globalSlug === 'string' && globalSlug.trim()) {
      return globalSlug;
    }
  }

  const configuredSlug = getEnvVar('VITE_DEFAULT_TENANT_SLUG');
  if (configuredSlug) {
    return configuredSlug;
  }

  return 'timelyone';
})();

const envDefaultSlug = String(runtimeDefaultSlug).toLowerCase();

export const DEFAULT_TENANT_SLUG = sanitizeTenantSlug(envDefaultSlug) || 'timelyone';

export const DEFAULT_TENANT_META = {
  slug: DEFAULT_TENANT_SLUG,
  name: 'TimelyOne',
  plan: {
    code: 'starter',
    name: 'Starter',
    features: ['pwa_admin'],
  },
  theme: {
    primary: '#6B7280',
    primaryForeground: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceForeground: '#1F2937',
    accent: '#4B5563',
    border: '#D1D5DB',
  },
  branding: {
    logoUrl: null,
    faviconUrl: '/vite.svg',
    appleTouchIconUrl: null,
    appName: 'TimelyOne',
    shortName: 'Timely',
    themeColor: '#6B7280',
    backgroundColor: '#FFFFFF',
    splashScreens: [],
    icons: [],
  },
  flags: {
    enableCustomerPwa: false,
    enableWebPush: false,
    enableReports: true,
  },
  modules: [],
  channels: {
    email: true,
    sms: false,
    whatsapp: false,
    push: false,
  },
  profile: {
    businessName: 'TimelyOne',
    email: 'contact@timely.one',
    phone: '',
    address: '',
    timezone: 'Europe/Lisbon',
    language: 'pt',
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '09:00', close: '16:00', closed: true },
    },
    appointmentDuration: 60,
    bufferTime: 15,
  },
};

export function sanitizeTenantSlug(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';

  const match = trimmed.match(/[a-z0-9-]+/g);
  if (!match) return '';

  return match.join('-');
}

export function resolveTenantSlug({ search, hostname, defaultSlug } = {}) {
  const fallbackSlug = sanitizeTenantSlug(defaultSlug) || DEFAULT_TENANT_SLUG;

  const sourceSearch =
    typeof search === 'string'
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : '';

  const querySlug = extractSlugFromQuery(sourceSearch);
  if (querySlug) {
    return querySlug;
  }

  const sourceHost =
    typeof hostname === 'string'
      ? hostname
      : typeof window !== 'undefined'
        ? window.location.hostname
        : '';

  const hostSlug = extractSlugFromHost(sourceHost);
  if (hostSlug) {
    return hostSlug;
  }

  return fallbackSlug;
}

export function extractSlugFromQuery(search) {
  if (!search) return '';
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const slug = params.get('tenant');
    return sanitizeTenantSlug(slug);
  } catch {
    return '';
  }
}

export function extractSlugFromHost(hostname) {
  if (!hostname) return '';

  const normalized = hostname.trim().toLowerCase();
  if (!normalized || normalized === 'localhost' || normalized === '127.0.0.1') {
    return '';
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length <= 1) {
    return '';
  }

  const filteredParts = parts[0] === 'www' ? parts.slice(1) : parts;
  if (filteredParts.length <= 1) {
    return '';
  }

  const [first, second] = filteredParts;

  if (second === 'localhost') {
    return sanitizeTenantSlug(first);
  }

  if (filteredParts.length === 2) {
    return '';
  }

  return sanitizeTenantSlug(first);
}

export function mergeTenantMeta(rawMeta, slug = DEFAULT_TENANT_SLUG) {
  if (!rawMeta || typeof rawMeta !== 'object') {
    return { ...DEFAULT_TENANT_META, slug };
  }

  const metaSlug = sanitizeTenantSlug(rawMeta.slug) || slug;

  return {
    ...DEFAULT_TENANT_META,
    ...rawMeta,
    slug: metaSlug,
    plan: normalizePlan(rawMeta.plan, DEFAULT_TENANT_META.plan),
    theme: normalizeTheme(rawMeta.theme, DEFAULT_TENANT_META.theme),
    branding: normalizeBranding(rawMeta.branding, DEFAULT_TENANT_META.branding),
    flags: {
      ...DEFAULT_TENANT_META.flags,
      ...(rawMeta.flags || {}),
    },
    modules: Array.isArray(rawMeta.modules) ? rawMeta.modules : DEFAULT_TENANT_META.modules,
    channels: normalizeChannels(rawMeta.channels, DEFAULT_TENANT_META.channels),
    profile: normalizeProfile(rawMeta.profile, DEFAULT_TENANT_META.profile),
  };
}

function normalizePlan(plan, fallback) {
  if (!plan || typeof plan !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...plan,
    code: sanitizeTenantSlug(plan.code) || fallback.code,
  };
}

function normalizeTheme(theme, fallback) {
  if (!theme || typeof theme !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...theme,
  };
}

function normalizeBranding(branding, fallback) {
  if (!branding || typeof branding !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...branding,
    splashScreens: Array.isArray(branding.splashScreens)
      ? branding.splashScreens
      : fallback.splashScreens,
    icons: Array.isArray(branding.icons) ? branding.icons : fallback.icons,
  };
}

function normalizeChannels(channels, fallback) {
  if (!channels || typeof channels !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...channels,
  };
}

function normalizeProfile(profile, fallback) {
  if (!profile || typeof profile !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...profile,
  };
}
