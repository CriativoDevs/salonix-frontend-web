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

const API_BASE_URL = (() => {
  const configured = getEnvVar('VITE_API_URL');
  try {
    return new URL(configured || 'http://localhost:8000/api/');
  } catch {
    return new URL('http://localhost:8000/api/');
  }
})();

export const DEFAULT_TENANT_SLUG = sanitizeTenantSlug(envDefaultSlug) || 'timelyone';

export const DEFAULT_TENANT_META = {
  slug: DEFAULT_TENANT_SLUG,
  name: 'TimelyOne',
  plan: {
    code: 'starter',
    name: 'Starter',
    features: ['pwa_admin'],
    tier: 'starter',
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
    primaryColor: '#6B7280',
    secondaryColor: '#1F2937',
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

export function resolveTenantAssetUrl(source) {
  if (!source || typeof source !== 'string') return '';
  try {
    return new URL(source, API_BASE_URL).toString();
  } catch {
    return source;
  }
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
    plan: normalizePlan(rawMeta.plan, rawMeta.plan_tier, DEFAULT_TENANT_META.plan),
    theme: normalizeTheme(rawMeta.theme, DEFAULT_TENANT_META.theme),
    branding: normalizeBranding(rawMeta.branding, rawMeta, DEFAULT_TENANT_META.branding),
    flags: {
      ...DEFAULT_TENANT_META.flags,
      ...(rawMeta.flags || {}),
    },
    modules: Array.isArray(rawMeta.modules) ? rawMeta.modules : DEFAULT_TENANT_META.modules,
    channels: normalizeChannels(rawMeta.channels, DEFAULT_TENANT_META.channels),
    profile: normalizeProfile(rawMeta.profile, DEFAULT_TENANT_META.profile),
  };
}

function normalizePlan(plan, fallbackTier, fallbackPlan) {
  const base = { ...fallbackPlan };
  if (plan && typeof plan === 'object') {
    Object.assign(base, plan);
  }

  const tier = plan?.tier || plan?.code || fallbackTier || fallbackPlan.tier;
  base.code = tier || base.code;
  base.tier = tier || base.tier;
  return base;
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

function normalizeBranding(brandingBlock, rawMeta, fallback) {
  const brandingSource = {
    ...(typeof brandingBlock === 'object' && brandingBlock ? brandingBlock : {}),
    logo_url: rawMeta?.logo_url ?? brandingBlock?.logo_url ?? brandingBlock?.logoUrl,
    favicon_url: rawMeta?.favicon_url ?? brandingBlock?.favicon_url ?? brandingBlock?.faviconUrl,
    apple_touch_icon_url:
      rawMeta?.apple_touch_icon_url ?? brandingBlock?.apple_touch_icon_url ?? brandingBlock?.appleTouchIconUrl,
    primary_color: rawMeta?.primary_color ?? brandingBlock?.primary_color ?? brandingBlock?.primaryColor,
    secondary_color: rawMeta?.secondary_color ?? brandingBlock?.secondary_color ?? brandingBlock?.secondaryColor,
    theme_color: rawMeta?.theme_color ?? brandingBlock?.theme_color ?? brandingBlock?.themeColor,
    background_color:
      rawMeta?.background_color ?? brandingBlock?.background_color ?? brandingBlock?.backgroundColor,
    app_name: rawMeta?.app_name ?? brandingBlock?.app_name ?? brandingBlock?.appName,
    short_name: rawMeta?.short_name ?? brandingBlock?.short_name ?? brandingBlock?.shortName,
    splash_screens: rawMeta?.splash_screens ?? brandingBlock?.splash_screens ?? brandingBlock?.splashScreens,
    icon_set: rawMeta?.icon_set ?? brandingBlock?.icon_set ?? brandingBlock?.icons,
  };

  const result = {
    ...fallback,
  };

  if (brandingSource.logo_url !== undefined) {
    result.logoUrl = brandingSource.logo_url || null;
  }
  if (brandingSource.favicon_url !== undefined) {
    result.faviconUrl = brandingSource.favicon_url || null;
  }
  if (brandingSource.apple_touch_icon_url !== undefined) {
    result.appleTouchIconUrl = brandingSource.apple_touch_icon_url || null;
  }
  if (brandingSource.primary_color) {
    result.primaryColor = brandingSource.primary_color;
  }
  if (brandingSource.secondary_color) {
    result.secondaryColor = brandingSource.secondary_color;
  }
  if (brandingSource.theme_color) {
    result.themeColor = brandingSource.theme_color;
  }
  if (brandingSource.background_color) {
    result.backgroundColor = brandingSource.background_color;
  }
  if (brandingSource.app_name) {
    result.appName = brandingSource.app_name;
  }
  if (brandingSource.short_name) {
    result.shortName = brandingSource.short_name;
  }
  if (Array.isArray(brandingSource.splash_screens)) {
    result.splashScreens = brandingSource.splash_screens;
  }
  if (Array.isArray(brandingSource.icon_set)) {
    result.icons = brandingSource.icon_set;
  }

  return result;
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
