import { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import Router from './routes/Router';
import { DEFAULT_TENANT_META } from './utils/tenant';

const THEME_VARIABLES = {
  primary: '--brand-primary',
  primaryForeground: '--brand-on-primary',
  surface: '--brand-surface',
  surfaceForeground: '--brand-on-surface',
  accent: '--brand-accent',
  border: '--brand-border',
};

const MANIFEST_LINK_ID = 'tenant-dynamic-manifest';
const APPLE_TOUCH_ICON_ID = 'tenant-apple-touch-icon';
const APPLE_SPLASH_ATTR = 'data-tenant-splash';

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
    const targetTheme = isAuthenticated ? theme : DEFAULT_TENANT_META.theme;
    const targetBranding = isAuthenticated
      ? branding || DEFAULT_TENANT_META.branding
      : DEFAULT_TENANT_META.branding;

    const effectiveTheme = { ...targetTheme };
    if (targetBranding?.primaryColor) {
      effectiveTheme.primary = targetBranding.primaryColor;
      effectiveTheme.accent = targetBranding.primaryColor;
      effectiveTheme.border = targetBranding.primaryColor;
    }
    if (targetBranding?.secondaryColor) {
      effectiveTheme.surfaceForeground = targetBranding.secondaryColor;
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
      body.dataset.tenantSlug = isAuthenticated ? slug : DEFAULT_TENANT_META.slug;
    }

    const updateFavicon = () => {
      const fallbackHref = originalAssetsRef.current?.faviconHref || '/vite.svg';
      const faviconHref =
        targetBranding.faviconUrl || targetBranding.logoUrl || fallbackHref;

      let faviconEl = document.querySelector('link[rel="icon"]');
      if (!faviconEl) {
        faviconEl = document.createElement('link');
        faviconEl.setAttribute('rel', 'icon');
        document.head.appendChild(faviconEl);
      }
      faviconEl.setAttribute('href', faviconHref);

      const appleIconHref =
        targetBranding.appleTouchIconUrl || targetBranding.logoUrl || faviconHref;
      let appleIconLink = document.getElementById(APPLE_TOUCH_ICON_ID);
      if (isAuthenticated && appleIconHref) {
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
          manifestLink.setAttribute('href', originalAssetsRef.current.manifestHref);
        }
        return;
      }

      const name = tenant?.name || targetBranding.appName || DEFAULT_TENANT_META.branding.appName;
      const shortName = targetBranding.shortName || tenant?.name || name;
      const themeColor = targetBranding.themeColor || effectiveTheme.primary;
      const backgroundColor = targetBranding.backgroundColor || effectiveTheme.surface;

      const manifestPayload = {
        name,
        short_name: shortName,
        start_url: '/',
        display: 'standalone',
        background_color: backgroundColor,
        theme_color: themeColor,
        icons:
          targetBranding.icons && targetBranding.icons.length
            ? targetBranding.icons
            : [
                targetBranding.logoUrl
                  ? {
                      src: targetBranding.logoUrl,
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

    const themeColorMeta = ensureMetaTag('theme-color');
    const appleWebAppTitleMeta = ensureMetaTag('apple-mobile-web-app-title');
    const appleCapableMeta = ensureMetaTag('apple-mobile-web-app-capable');

    if (isAuthenticated) {
      const tenantTitle = tenant?.name || targetBranding.appName || DEFAULT_TENANT_META.branding.appName;
      document.title = tenantTitle;
      themeColorMeta.setAttribute('content', targetBranding.themeColor || effectiveTheme.primary);
      appleWebAppTitleMeta.setAttribute(
        'content',
        targetBranding.shortName || tenant?.name || tenantTitle
      );
      appleCapableMeta.setAttribute('content', 'yes');
    } else {
      document.title = DEFAULT_TENANT_META.branding.appName;
      if (originalAssetsRef.current?.themeColor) {
        themeColorMeta.setAttribute('content', originalAssetsRef.current.themeColor);
      } else {
        themeColorMeta.removeAttribute('content');
      }
      appleWebAppTitleMeta.removeAttribute('content');
      appleCapableMeta.removeAttribute('content');
    }

    const updateSplashScreens = () => {
      const existingSplashes = document.querySelectorAll(`link[${APPLE_SPLASH_ATTR}="true"]`);
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
        delete body.dataset.tenantSlug;
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
    <TenantProvider>
      <AuthProvider>
        <TenantThemeManager />
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </AuthProvider>
    </TenantProvider>
  );
}

export default App;
