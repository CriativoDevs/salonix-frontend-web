import { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RateLimitProvider } from './contexts/RateLimitContext';
import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import useBillingOverview from './hooks/useBillingOverview';
import Router from './routes/Router';
import RateLimitWarning from './components/ui/RateLimitWarning';
import { DEFAULT_TENANT_META, resolveTenantAssetUrl } from './utils/tenant';

const THEME_VARIABLES = {
  primary: '--brand-primary',
  primaryForeground: '--brand-on-primary',
  surface: '--brand-surface',
  surfaceForeground: '--brand-on-surface',
  accent: '--brand-accent',
  border: '--brand-border',
  secondary: '--brand-secondary',
  secondaryForeground: '--brand-on-secondary',
  highlight: '--brand-highlight',
  highlightForeground: '--brand-on-highlight',
};

const MANIFEST_LINK_ID = 'tenant-dynamic-manifest';
const APPLE_TOUCH_ICON_ID = 'tenant-apple-touch-icon';
const APPLE_SPLASH_ATTR = 'data-tenant-splash';

// PNG 16x16 transparente como fallback seguro para navegadores (Chrome/Opera/Safari)
const FALLBACK_FAVICON_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABGUlEQVR42mNkYGBgYGB4+fLl/4eBgQGMAQB8ZgYQJH7//79gMDEwMDAwYGGgkJMZgEAEjYjIAJRJEgCGJAAw2bNnAATbnx8fDwMjI0NDRSmSJFDgAEMwMDAwgBAtGkQEmFChQkAAGqZMmXKABFQkGgAABY1a9ZMAAFgkGgAAEoQ0aNAgAAGCTp0+fAAAGYp8+fQAAGpCenp6AAAXgN7v37+AABiZGRkZAAAsYGBgYAAAEgAAwZV2vH0tB7MAAAAASUVORK5CYII=';

function ensureMetaTag(name) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  return meta;
}

function TenantThemeManager() {
  const { isAuthenticated } = useAuth();
  const { slug, theme, branding, tenant } = useTenant();
  const originalAssetsRef = useRef(null);
  const manifestObjectUrlRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    const body = document.body;
    const pathname = window.location?.pathname || '/';
    const targetTheme = isAuthenticated ? theme : DEFAULT_TENANT_META.theme;
    // Usar branding resolvido do tenant mesmo em telas públicas (não autenticadas)
    const targetBranding = branding || DEFAULT_TENANT_META.branding;
    const hasExplicitSlug = !!slug && slug !== DEFAULT_TENANT_META.slug;

    const effectiveTheme = { ...targetTheme };

    // Garantir que as cores de texto sejam adequadas para o tema atual
    const isDarkTheme = root.classList.contains('theme-dark');
    if (isDarkTheme) {
      // No tema escuro, usar cores claras para texto
      effectiveTheme.surfaceForeground =
        effectiveTheme.surfaceForeground || '#f8fafc';
    } else {
      // No tema claro, usar cores escuras para texto
      effectiveTheme.surfaceForeground =
        effectiveTheme.surfaceForeground || '#0f172a';
    }

    if (!originalAssetsRef.current) {
      const favicon = document.querySelector('link[rel="icon"]');
      const manifest = document.querySelector('link[rel="manifest"]');
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');

      originalAssetsRef.current = {
        title: document.title,
        faviconHref: favicon?.getAttribute('href') || null,
        manifestHref: manifest?.getAttribute('href') || null,
        themeColor: themeColorMeta?.getAttribute('content') || null,
      };
    }

    Object.entries(THEME_VARIABLES).forEach(([key, cssVar]) => {
      const value = effectiveTheme?.[key] || DEFAULT_TENANT_META.theme[key];
      root.style.setProperty(cssVar, value);
    });

    if (body) {
      if (isAuthenticated || hasExplicitSlug) {
        body.dataset.tenantSlug = slug;
      } else {
        delete body.dataset.tenantSlug;
      }
    }

    const updateFavicon = () => {
      const brandIconSrc =
        targetBranding.faviconUrl || targetBranding.logoUrl || '';
      const brandIconHref = brandIconSrc
        ? resolveTenantAssetUrl(brandIconSrc)
        : '';

      let faviconEl = document.querySelector('link[rel="icon"]');
      if (!faviconEl) {
        faviconEl = document.createElement('link');
        faviconEl.setAttribute('rel', 'icon');
        document.head.appendChild(faviconEl);
      }

      if (brandIconHref) {
        faviconEl.removeAttribute('type');
        faviconEl.removeAttribute('sizes');
        faviconEl.setAttribute('href', brandIconHref);
      } else {
        faviconEl.setAttribute('type', 'image/png');
        faviconEl.setAttribute('sizes', '32x32');
        faviconEl.setAttribute('href', FALLBACK_FAVICON_PNG_DATA_URL);
      }

      // Também criar/atualizar "shortcut icon" para compatibilidade (Chrome/Opera)
      let shortcutEl = document.querySelector('link[rel="shortcut icon"]');
      if (!shortcutEl) {
        shortcutEl = document.createElement('link');
        shortcutEl.setAttribute('rel', 'shortcut icon');
        document.head.appendChild(shortcutEl);
      }

      if (brandIconHref) {
        shortcutEl.removeAttribute('type');
        shortcutEl.removeAttribute('sizes');
        shortcutEl.setAttribute('href', brandIconHref);
      } else {
        shortcutEl.setAttribute('type', 'image/png');
        shortcutEl.setAttribute('sizes', '32x32');
        shortcutEl.setAttribute('href', FALLBACK_FAVICON_PNG_DATA_URL);
      }

      const appleRawSrc = targetBranding.appleTouchIconUrl || brandIconSrc;
      const appleIconHref = appleRawSrc
        ? resolveTenantAssetUrl(appleRawSrc)
        : FALLBACK_FAVICON_PNG_DATA_URL;

      let appleIconLink = document.getElementById(APPLE_TOUCH_ICON_ID);
      const shouldShowAppleIcon =
        isAuthenticated || (hasExplicitSlug && !!appleRawSrc);
      if (shouldShowAppleIcon) {
        if (!appleIconLink) {
          appleIconLink = document.createElement('link');
          appleIconLink.id = APPLE_TOUCH_ICON_ID;
          appleIconLink.setAttribute('rel', 'apple-touch-icon');
          document.head.appendChild(appleIconLink);
        }
        appleIconLink.setAttribute('href', appleIconHref);
      } else if (appleIconLink) {
        appleIconLink.remove();
      }
    };

    const updateManifest = () => {
      if (manifestObjectUrlRef.current) {
        URL.revokeObjectURL(manifestObjectUrlRef.current);
        manifestObjectUrlRef.current = null;
      }

      if (!isAuthenticated) {
        const existingDynamic = document.getElementById(MANIFEST_LINK_ID);
        if (existingDynamic) {
          existingDynamic.remove();
        }

        if (originalAssetsRef.current?.manifestHref) {
          let manifestLink = document.querySelector('link[rel="manifest"]');
          if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.setAttribute('rel', 'manifest');
            document.head.appendChild(manifestLink);
          }
          manifestLink.setAttribute(
            'href',
            originalAssetsRef.current.manifestHref
          );
        }
        return;
      }

      const name =
        tenant?.name ||
        targetBranding.appName ||
        DEFAULT_TENANT_META.branding.appName;
      const shortName = targetBranding.shortName || tenant?.name || name;
      const themeColor = root.classList.contains('theme-dark')
        ? '#0f172a'
        : '#ffffff';
      const backgroundColor = root.classList.contains('theme-dark')
        ? '#0f172a'
        : '#ffffff';

      const manifestPayload = {
        name,
        short_name: shortName,
        start_url: window.location.origin + '/',
        display: 'standalone',
        background_color: backgroundColor,
        theme_color: themeColor,
        icons:
          targetBranding.icons && targetBranding.icons.length
            ? targetBranding.icons.map((icon) => ({
                ...icon,
                src: icon.src.startsWith('http')
                  ? icon.src
                  : window.location.origin + icon.src,
              }))
            : [
                targetBranding.logoUrl
                  ? {
                      src: targetBranding.logoUrl.startsWith('http')
                        ? targetBranding.logoUrl
                        : window.location.origin + targetBranding.logoUrl,
                      sizes: '512x512',
                      type: 'image/png',
                    }
                  : null,
              ].filter(Boolean),
      };

      const manifestBlob = new Blob([JSON.stringify(manifestPayload)], {
        type: 'application/json',
      });
      manifestObjectUrlRef.current = URL.createObjectURL(manifestBlob);

      let manifestLink = document.getElementById(MANIFEST_LINK_ID);
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.id = MANIFEST_LINK_ID;
        manifestLink.setAttribute('rel', 'manifest');
        document.head.appendChild(manifestLink);
      }
      manifestLink.setAttribute('href', manifestObjectUrlRef.current);
    };

    const appleWebAppTitleMeta = ensureMetaTag('apple-mobile-web-app-title');
    const appleCapableMeta = ensureMetaTag('apple-mobile-web-app-capable');
    const mobileCapableMeta = ensureMetaTag('mobile-web-app-capable');

    if (isAuthenticated) {
      // Se estiver no /ops, manter identidade do Ops
      if (pathname.startsWith('/ops')) {
        document.title = 'Ops Console';
        // Opcional: Resetar favicon/meta para padrão do Ops se tiver assets específicos
        return;
      }

      const tenantTitle =
        tenant?.name ||
        targetBranding.appName ||
        DEFAULT_TENANT_META.branding.appName;
      document.title = tenantTitle;
      appleWebAppTitleMeta.setAttribute(
        'content',
        targetBranding.shortName || tenant?.name || tenantTitle
      );
      appleCapableMeta.setAttribute('content', 'yes');
      mobileCapableMeta.setAttribute('content', 'yes');
    } else {
      // Regra: Landing sempre TimelyOne; Telas públicas com slug mostram nome do tenant; sem slug, TimelyOne
      const isLanding = pathname === '/';
      if (isLanding || pathname.startsWith('/ops')) {
        // Ops Login também deve ser neutro/Ops
        document.title = pathname.startsWith('/ops')
          ? 'Ops Console'
          : DEFAULT_TENANT_META.branding.appName;
      } else if (hasExplicitSlug && (tenant?.name || '').length > 0) {
        document.title = tenant.name;
      } else {
        document.title = DEFAULT_TENANT_META.branding.appName;
      }

      // Metas PWA básicas em público: título segue mesma regra de document.title
      const publicAppTitle = isLanding
        ? DEFAULT_TENANT_META.branding.appName
        : hasExplicitSlug && (tenant?.name || '').length > 0
          ? tenant.name
          : DEFAULT_TENANT_META.branding.appName;
      appleWebAppTitleMeta.setAttribute('content', publicAppTitle);
      // Só marcamos como "capable" em público quando houver slug explícito
      if (hasExplicitSlug) {
        appleCapableMeta.setAttribute('content', 'yes');
        mobileCapableMeta.setAttribute('content', 'yes');
      } else {
        appleCapableMeta.removeAttribute('content');
        mobileCapableMeta.removeAttribute('content');
      }
    }

    const updateSplashScreens = () => {
      const existingSplashes = document.querySelectorAll(
        `link[${APPLE_SPLASH_ATTR}="true"]`
      );
      existingSplashes.forEach((link) => link.remove());

      if (!isAuthenticated) {
        return;
      }

      const splashScreens = Array.isArray(targetBranding.splashScreens)
        ? targetBranding.splashScreens
        : [];

      splashScreens.forEach((screen) => {
        if (!screen || !screen.src) return;
        const splashLink = document.createElement('link');
        splashLink.setAttribute('rel', 'apple-touch-startup-image');
        splashLink.setAttribute(APPLE_SPLASH_ATTR, 'true');
        splashLink.setAttribute('href', screen.src);
        if (screen.media) {
          splashLink.setAttribute('media', screen.media);
        }
        if (screen.sizes) {
          splashLink.setAttribute('sizes', screen.sizes);
        }
        document.head.appendChild(splashLink);
      });
    };

    updateFavicon();
    updateManifest();
    updateSplashScreens();

    return () => {
      Object.values(THEME_VARIABLES).forEach((cssVar) => {
        root.style.removeProperty(cssVar);
      });

      if (!isAuthenticated && body) {
        if (!hasExplicitSlug) {
          delete body.dataset.tenantSlug;
        }
      }

      if (manifestObjectUrlRef.current && !isAuthenticated) {
        URL.revokeObjectURL(manifestObjectUrlRef.current);
        manifestObjectUrlRef.current = null;
      }
    };
  }, [isAuthenticated, slug, theme, branding, tenant]);

  return null;
}

function App() {
  return (
    <RateLimitProvider>
      <TenantProvider>
        <AuthProvider>
          <ThemeProvider>
            <TenantThemeManager />
            <BillingSyncManager />
            <BrowserRouter>
              <Router />
              <RateLimitWarning />
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </TenantProvider>
    </RateLimitProvider>
  );
}

export default App;
export { TenantThemeManager };

function BillingSyncManager() {
  const { isAuthenticated } = useAuth();
  const { overview, refresh } = useBillingOverview({
    enabled: isAuthenticated,
  });
  const { plan, refetch } = useTenant();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const code = String(
      overview?.current_subscription?.plan_code || ''
    ).toLowerCase();
    const tier = String(plan?.tier || plan?.code || '').toLowerCase();
    if (code && code !== tier) {
      refetch();
    }
  }, [
    overview?.current_subscription?.plan_code,
    plan?.tier,
    plan?.code,
    refetch,
    isAuthenticated,
  ]);

  return null;
}
