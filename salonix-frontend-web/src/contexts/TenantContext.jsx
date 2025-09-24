import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchTenantMeta } from '../api/tenant';
import { parseApiError } from '../utils/apiError';
import {
  DEFAULT_TENANT_META,
  DEFAULT_TENANT_SLUG,
  mergeTenantMeta,
  resolveTenantSlug,
  sanitizeTenantSlug,
} from '../utils/tenant';
import {
  getStoredTenantSlug,
  storeTenantSlug,
} from '../utils/tenantStorage';

const defaultContextValue = {
  slug: DEFAULT_TENANT_SLUG,
  tenant: DEFAULT_TENANT_META,
  plan: DEFAULT_TENANT_META.plan,
  flags: DEFAULT_TENANT_META.flags,
  theme: DEFAULT_TENANT_META.theme,
  modules: DEFAULT_TENANT_META.modules,
  branding: DEFAULT_TENANT_META.branding,
  channels: DEFAULT_TENANT_META.channels,
  profile: DEFAULT_TENANT_META.profile,
  loading: true,
  error: null,
  refetch: async () => DEFAULT_TENANT_META,
  setTenantSlug: () => {},
  applyTenantBootstrap: () => {},
};

const TenantContext = createContext(defaultContextValue);

export function TenantProvider({ children }) {
  const [slug, setSlug] = useState(() => {
    const stored = getStoredTenantSlug();
    if (stored) return stored;
    return resolveTenantSlug();
  });
  const [tenant, setTenant] = useState(DEFAULT_TENANT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortController = useRef(null);
  const skipNextLoadRef = useRef(false);

  const loadTenant = useCallback(
    async (targetSlug, { silent = false } = {}) => {
      const sanitizedSlug = sanitizeTenantSlug(targetSlug) || DEFAULT_TENANT_SLUG;

      if (abortController.current) {
        abortController.current.abort();
      }

      const controller = new AbortController();
      abortController.current = controller;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetchTenantMeta(sanitizedSlug, {
          signal: controller.signal,
        });
        const merged = mergeTenantMeta(response?.data, sanitizedSlug);
        if (!controller.signal.aborted) {
          setTenant(merged);
          setSlug(merged.slug || sanitizedSlug);
        }
        return merged;
      } catch (err) {
        if (controller.signal.aborted) {
          return DEFAULT_TENANT_META;
        }

        const parsedError = parseApiError(
          err,
          'Não foi possível carregar os dados do salão.'
        );

        setError(parsedError);
        if (!silent) {
          const fallbackMeta = { ...DEFAULT_TENANT_META, slug: sanitizedSlug };
          setTenant(fallbackMeta);
          setSlug(sanitizedSlug);
          return fallbackMeta;
        }
        return DEFAULT_TENANT_META;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  const applyTenantBootstrap = useCallback(
    (bootstrapMeta) => {
      if (!bootstrapMeta || typeof bootstrapMeta !== 'object') {
        return;
      }

      const sanitizedSlug = sanitizeTenantSlug(bootstrapMeta.slug);
      if (!sanitizedSlug) {
        return;
      }

      const merged = mergeTenantMeta(bootstrapMeta, sanitizedSlug);
      const slugChanged = merged.slug !== slug;
      skipNextLoadRef.current = slugChanged;
      setTenant(merged);
      setSlug(merged.slug);
      setError(null);
      setLoading(false);
      storeTenantSlug(merged.slug);
      loadTenant(merged.slug, { silent: true });
      if (!slugChanged) {
        skipNextLoadRef.current = false;
      }
    },
    [loadTenant, slug]
  );

  const updateSlug = useCallback(
    (nextSlug) => {
      const sanitized = sanitizeTenantSlug(nextSlug);
      if (!sanitized) {
        return;
      }

      if (sanitized === slug) {
        storeTenantSlug(sanitized);
        loadTenant(sanitized, { silent: true });
        return;
      }

      skipNextLoadRef.current = false;
      storeTenantSlug(sanitized);
      setSlug(sanitized);
    },
    [loadTenant, slug]
  );

  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return () => {
        if (abortController.current) {
          abortController.current.abort();
        }
      };
    }

    loadTenant(slug);

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadTenant, slug]);

  const contextValue = useMemo(() => {
    return {
      slug,
      tenant,
      plan: tenant.plan || DEFAULT_TENANT_META.plan,
      flags: tenant.flags || DEFAULT_TENANT_META.flags,
      theme: tenant.theme || DEFAULT_TENANT_META.theme,
      modules: tenant.modules || DEFAULT_TENANT_META.modules,
      branding: tenant.branding || DEFAULT_TENANT_META.branding,
      channels: tenant.channels || DEFAULT_TENANT_META.channels,
      profile: tenant.profile || DEFAULT_TENANT_META.profile,
      loading,
      error,
      refetch: () => loadTenant(slug),
      setTenantSlug: updateSlug,
      applyTenantBootstrap,
    };
  }, [slug, tenant, loading, error, loadTenant, updateSlug, applyTenantBootstrap]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantContext;
