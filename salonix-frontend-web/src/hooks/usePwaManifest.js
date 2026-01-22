import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to manage PWA manifest and meta tags dynamically based on tenant context.
 * 
 * Logic:
 * - If tenant is present:
 *   - Updates iOS meta tag (apple-mobile-web-app-title) to tenant name.
 *   - Updates Android manifest (name/short_name) to tenant name via Blob URL.
 * - If no tenant (default):
 *   - Reverts to "TimelyOne".
 *   - Uses default manifest.
 * 
 * @param {Object} tenant - The current tenant object (can be null).
 */
export function usePwaManifest(tenant) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 1. Identify context
    const appName = tenant?.name || 'TimelyOne';
    const isOps = window.location.pathname.startsWith('/ops');
    
    // Priority: Ops > Tenant > Default
    const finalName = isOps ? 'TimelyOne Ops' : appName;

    // 2. Update iOS Meta Tag
    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) {
      metaTitle.setAttribute('content', finalName);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'apple-mobile-web-app-title';
      newMeta.content = finalName;
      document.head.appendChild(newMeta);
    }

    // 3. Update Android Manifest
    // Only fetch and replace if we have a specific tenant name (not default)
    // and we are NOT in Ops (Ops has its own static manifest handled in index.html)
    if (!isOps && tenant?.name) {
      const link = document.querySelector('link[rel="manifest"]');
      
      if (link) {
        // Fetch the base manifest
        fetch('/manifest.webmanifest')
          .then((response) => response.json())
          .then((manifest) => {
            // Modify manifest
            manifest.name = finalName;
            manifest.short_name = finalName;

            // Create Blob
            const stringManifest = JSON.stringify(manifest);
            const blob = new Blob([stringManifest], { type: 'application/json' });
            const manifestURL = URL.createObjectURL(blob);

            // Update link
            link.setAttribute('href', manifestURL);
          })
          .catch((err) => console.error('Error updating PWA manifest:', err));
      }
    } else if (!isOps && !tenant) {
        // Revert to default manifest if logged out / no tenant
        const link = document.querySelector('link[rel="manifest"]');
        if (link && link.href.startsWith('blob:')) {
            link.setAttribute('href', '/manifest.webmanifest');
        }
    }

  }, [tenant, i18n.language]); // Re-run if tenant changes
}
