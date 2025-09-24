import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContextInstance';
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  setLogoutHandler,
} from '../utils/authStorage';
import {
  login as loginRequest,
  refreshToken,
  fetchFeatureFlags,
  fetchTenantBootstrap,
} from '../api/auth';
import { parseApiError, hasActionableError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import { DEFAULT_TENANT_META } from '../utils/tenant';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  const { applyTenantBootstrap, setTenantSlug } = useTenant();

  const resetState = useCallback(() => {
    setIsAuthenticated(false);
    setFeatureFlags(null);
    setAuthError(null);
    setTenantInfo(null);
    setTenantSlug(DEFAULT_TENANT_META.slug);
  }, [setTenantSlug]);

  const handleLogout = useCallback(() => {
    clearTokens();
    resetState();
  }, [resetState]);

  useEffect(() => {
    setLogoutHandler(handleLogout);
  }, [handleLogout]);

  const loadFeatureFlags = useCallback(async () => {
    try {
      const flags = await fetchFeatureFlags();
      setFeatureFlags(flags);
    } catch (error) {
      if (hasActionableError(error?.response?.data?.error?.code)) {
        setAuthError(parseApiError(error, 'Não foi possível carregar suas permissões.'));
      }
    }
  }, []);

  const loadTenantBootstrap = useCallback(async () => {
    try {
      const tenant = await fetchTenantBootstrap();
      if (tenant?.slug) {
        applyTenantBootstrap(tenant);
        setTenantInfo(tenant);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 403) {
        setTenantInfo(null);
        setTenantSlug(DEFAULT_TENANT_META.slug);
      }
    }
  }, [applyTenantBootstrap, setTenantSlug]);

  useEffect(() => {
    const bootstrap = async () => {
      const storedRefresh = getRefreshToken();
      if (!storedRefresh) {
        setIsLoading(false);
        return;
      }

      try {
        const { access } = await refreshToken(storedRefresh);
        if (access) {
          setAccessToken(access);
          setIsAuthenticated(true);
          await loadTenantBootstrap();
          await loadFeatureFlags();
        }
      } catch {
        clearTokens();
        resetState();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [loadFeatureFlags, loadTenantBootstrap, resetState]);

  const login = useCallback(
    async ({ email, password }) => {
      setAuthError(null);
      try {
        const { access, refresh, tenant } = await loginRequest(email, password);
        if (access) {
          setAccessToken(access);
        }
        if (refresh) {
          setRefreshToken(refresh);
        }
        if (tenant?.slug) {
          applyTenantBootstrap(tenant);
          setTenantInfo(tenant);
        } else {
          setTenantInfo(null);
          setTenantSlug(DEFAULT_TENANT_META.slug);
        }
        setIsAuthenticated(true);
        await loadFeatureFlags();
      } catch (error) {
        const parsedError = parseApiError(error, 'Erro ao autenticar.');
        setAuthError(parsedError);
        throw parsedError;
      }
    },
    [applyTenantBootstrap, loadFeatureFlags, setTenantSlug]
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      featureFlags,
      tenant: tenantInfo,
      login,
      logout: handleLogout,
      authError,
      clearAuthError,
    }),
    [
      isAuthenticated,
      isLoading,
      featureFlags,
      tenantInfo,
      login,
      handleLogout,
      authError,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
