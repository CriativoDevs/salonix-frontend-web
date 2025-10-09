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

export const PLAN_NAME_BY_TIER = {
  starter: 'Starter',
  basic: 'Basic',
  standard: 'Standard',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

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
    addons: [],
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
    enableAdminPwa: true,
    enableNativeAdmin: false,
    enableNativeClient: false,
    enableMobilePush: false,
    enableSms: false,
    enableWhatsapp: false,
    planTier: 'starter',
  },
  modules: [],
  channels: {
    email: true,
    sms: false,
    whatsapp: false,
    push: false,
    push_web: false,
    push_mobile: false,
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

  const rawFeatureFlags = rawMeta.feature_flags || rawMeta.flags;
  const normalizedFlags = normalizeFlags(rawFeatureFlags, DEFAULT_TENANT_META.flags);

  return {
    ...DEFAULT_TENANT_META,
    ...rawMeta,
    slug: metaSlug,
    plan: normalizePlan(
      rawMeta.plan,
      rawMeta.plan_tier || normalizedFlags.planTier,
      DEFAULT_TENANT_META.plan
    ),
    theme: normalizeTheme(rawMeta.theme, DEFAULT_TENANT_META.theme),
    branding: normalizeBranding(rawMeta.branding, rawMeta, DEFAULT_TENANT_META.branding),
    flags: normalizedFlags,
    featureFlagsRaw: rawFeatureFlags || null,
    modules: normalizeModules(
      rawMeta.modules,
      rawFeatureFlags,
      DEFAULT_TENANT_META.modules
    ),
    channels: normalizeChannels(
      rawMeta.channels,
      DEFAULT_TENANT_META.channels,
      rawFeatureFlags
    ),
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
  if (typeof base.code === 'string') {
    const sanitizedCode = sanitizeTenantSlug(base.code);
    base.code = sanitizedCode || base.code.toLowerCase();
  }
  if (typeof base.tier === 'string') {
    const sanitizedTier = sanitizeTenantSlug(base.tier);
    base.tier = sanitizedTier || base.tier.toLowerCase();
  }
  const normalizedTier = typeof base.tier === 'string' ? base.tier : undefined;
  if (plan?.name && typeof plan.name === 'string') {
    base.name = plan.name;
  } else if (normalizedTier && PLAN_NAME_BY_TIER[normalizedTier]) {
    base.name = PLAN_NAME_BY_TIER[normalizedTier];
  } else if (normalizedTier) {
    base.name = normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1);
  }
  if (Array.isArray(plan?.addons)) {
    base.addons = plan.addons;
  } else if (!Array.isArray(base.addons)) {
    base.addons = [];
  }
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

function normalizeChannels(channels, fallback, featureFlags) {
  const base = {
    ...fallback,
  };

  if (channels && typeof channels === 'object') {
    Object.assign(base, channels);
  }

  const notifications = featureFlags?.notifications;
  if (notifications && typeof notifications === 'object') {
    if ('push_web' in notifications) {
      base.push_web = Boolean(notifications.push_web);
    }
    if ('push_mobile' in notifications) {
      base.push_mobile = Boolean(notifications.push_mobile);
    }
    if ('sms' in notifications) {
      base.sms = Boolean(notifications.sms);
    }
    if ('whatsapp' in notifications) {
      base.whatsapp = Boolean(notifications.whatsapp);
    }
    base.push = Boolean(base.push_web || base.push_mobile);
  }

  return base;
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

function normalizeFlags(featureFlags, fallback) {
  const base = {
    ...fallback,
  };

  if (!featureFlags || typeof featureFlags !== 'object') {
    return base;
  }

  if (featureFlags.plan_tier || featureFlags.planTier) {
    base.planTier = featureFlags.plan_tier || featureFlags.planTier;
  }

  const mergedModules = {
    ...(featureFlags.modules || {}),
    reports_enabled: featureFlags.reports_enabled,
    pwa_admin_enabled: featureFlags.pwa_admin_enabled,
    pwa_client_enabled: featureFlags.pwa_client_enabled,
    rn_admin_enabled: featureFlags.rn_admin_enabled,
    rn_client_enabled: featureFlags.rn_client_enabled,
  };

  const mergedNotifications = {
    ...(featureFlags.notifications || {}),
    push_web: featureFlags.push_web_enabled,
    push_mobile: featureFlags.push_mobile_enabled,
    sms: featureFlags.sms_enabled,
    whatsapp: featureFlags.whatsapp_enabled,
  };

  if ('reports_enabled' in mergedModules) {
    base.enableReports = Boolean(mergedModules.reports_enabled);
  }
  if ('pwa_admin_enabled' in mergedModules) {
    base.enableAdminPwa = Boolean(mergedModules.pwa_admin_enabled);
  }
  if ('pwa_client_enabled' in mergedModules) {
    base.enableCustomerPwa = Boolean(mergedModules.pwa_client_enabled);
  }
  if ('rn_admin_enabled' in mergedModules) {
    base.enableNativeAdmin = Boolean(mergedModules.rn_admin_enabled);
  }
  if ('rn_client_enabled' in mergedModules) {
    base.enableNativeClient = Boolean(mergedModules.rn_client_enabled);
  }
  if ('push_web' in mergedNotifications) {
    base.enableWebPush = Boolean(mergedNotifications.push_web);
  }
  if ('push_mobile' in mergedNotifications) {
    base.enableMobilePush = Boolean(mergedNotifications.push_mobile);
  }
  if ('sms' in mergedNotifications) {
    base.enableSms = Boolean(mergedNotifications.sms);
  }
  if ('whatsapp' in mergedNotifications) {
    base.enableWhatsapp = Boolean(mergedNotifications.whatsapp);
  }

  return base;
}

function normalizeModules(modules, featureFlags, fallback) {
  if (Array.isArray(modules) && modules.length > 0) {
    return modules;
  }

  const moduleMap = [];
  const source = featureFlags?.modules;
  if (source && typeof source === 'object') {
    if (source.reports_enabled) moduleMap.push('reports');
    if (source.pwa_admin_enabled) moduleMap.push('pwa_admin');
    if (source.pwa_client_enabled) moduleMap.push('pwa_client');
    if (source.rn_admin_enabled) moduleMap.push('rn_admin');
    if (source.rn_client_enabled) moduleMap.push('rn_client');
  }

  if (Array.isArray(featureFlags?.addons_enabled)) {
    for (const addon of featureFlags.addons_enabled) {
      if (typeof addon === 'string' && !moduleMap.includes(addon)) {
        moduleMap.push(addon);
      }
    }
  }

  if (moduleMap.length > 0) {
    return moduleMap;
  }

  return Array.isArray(fallback) ? fallback : [];
}
