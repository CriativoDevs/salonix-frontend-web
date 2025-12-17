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
  fetchCurrentUser,
} from '../api/auth';
import { parseApiError, hasActionableError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import { DEFAULT_TENANT_META } from '../utils/tenant';
import { clearStoredTenantSlug, storeTenantSlug } from '../utils/tenantStorage';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const { applyTenantBootstrap, setTenantSlug } = useTenant();

  const resetState = useCallback(() => {
    setIsAuthenticated(false);
    setFeatureFlags(null);
    setAuthError(null);
    setTenantInfo(null);
    setUserInfo(null);
    setTenantSlug(DEFAULT_TENANT_META.slug);
    clearStoredTenantSlug();
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
        setAuthError(
          parseApiError(error, 'Não foi possível carregar suas permissões.')
        );
      }
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUserInfo(profile);
      return true;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.warn(
          '[Auth] loadCurrentUser failed with auth error. Forcing logout.'
        );
        handleLogout();
      } else {
        console.warn('[Auth] loadCurrentUser failed:', error);
      }
      return false;
    }
  }, [handleLogout]);

  const loadTenantBootstrap = useCallback(async () => {
    try {
      const tenant = await fetchTenantBootstrap();
      if (tenant?.slug) {
        console.log('[Auth] loadTenantBootstrap OK. slug=', tenant.slug);
        applyTenantBootstrap(tenant);
        storeTenantSlug(tenant.slug);
        setTenantInfo(tenant);
        return true;
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 403) {
        console.warn(
          '[Auth] loadTenantBootstrap: user has no tenant or forbidden. status=',
          status
        );
        setTenantInfo(null);
        setTenantSlug(DEFAULT_TENANT_META.slug);
        clearStoredTenantSlug();
        const friendlyError = parseApiError(
          error,
          'Sua conta não possui um salão associado. Contacte o suporte.'
        );
        setAuthError(friendlyError);
        clearTokens();
        resetState();
        return false;
      }
      console.warn('[Auth] loadTenantBootstrap error:', error);
    }
    return true;
  }, [applyTenantBootstrap, setTenantSlug, resetState]);

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
          const userLoaded = await loadCurrentUser();
          if (!userLoaded) {
            setIsLoading(false);
            return;
          }
          const tenantLoaded = await loadTenantBootstrap();
          if (tenantLoaded) {
            await loadFeatureFlags();
          }
        }
      } catch {
        console.warn('[Auth] refresh token flow failed, clearing tokens');
        clearTokens();
        resetState();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [loadFeatureFlags, loadTenantBootstrap, loadCurrentUser, resetState]);

  const login = useCallback(
    async ({ email, password }) => {
      setAuthError(null);
      try {
        const bypass = import.meta.env.VITE_CAPTCHA_BYPASS_TOKEN || undefined;
        const { access, refresh, tenant, user } = await loginRequest(
          email,
          password,
          {
            captchaBypassToken: bypass,
          }
        );
        if (access) {
          setAccessToken(access);
        }
        if (refresh) {
          setRefreshToken(refresh);
        }
        if (tenant?.slug) {
          console.log(
            '[Auth] login payload included tenant. slug=',
            tenant.slug
          );
          applyTenantBootstrap(tenant);
          storeTenantSlug(tenant.slug);
          setTenantInfo(tenant);
        } else {
          setTenantInfo(null);
          setTenantSlug(DEFAULT_TENANT_META.slug);
          clearStoredTenantSlug();
        }
        setIsAuthenticated(true);
        let userLoaded = true;
        if (user) {
          setUserInfo(user);
        } else {
          userLoaded = await loadCurrentUser();
        }
        if (userLoaded) {
          await loadFeatureFlags();
        }
      } catch (error) {
        console.warn('[Auth] login request failed:', error);
        const parsedError = parseApiError(error, 'Erro ao autenticar.');
        setAuthError(parsedError);
        throw parsedError;
      }
    },
    [applyTenantBootstrap, loadCurrentUser, loadFeatureFlags, setTenantSlug]
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      featureFlags,
      user: userInfo,
      tenant: tenantInfo,
      login,
      logout: handleLogout,
      refreshUser: loadCurrentUser,
      authError,
      clearAuthError,
    }),
    [
      isAuthenticated,
      isLoading,
      featureFlags,
      userInfo,
      tenantInfo,
      login,
      handleLogout,
      loadCurrentUser,
      authError,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
