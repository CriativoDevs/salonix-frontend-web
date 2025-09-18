import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContextInstance';
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  setLogoutHandler,
} from '../utils/authStorage';
import { login as loginRequest, refreshToken, fetchFeatureFlags } from '../api/auth';
import { parseApiError, hasActionableError } from '../utils/apiError';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [authError, setAuthError] = useState(null);

  const resetState = useCallback(() => {
    setIsAuthenticated(false);
    setFeatureFlags(null);
    setAuthError(null);
  }, []);

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
          await loadFeatureFlags();
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [loadFeatureFlags]);

  const login = useCallback(
    async ({ email, password }) => {
      setAuthError(null);
      try {
        const { access, refresh } = await loginRequest(email, password);
        if (access) {
          setAccessToken(access);
        }
        if (refresh) {
          setRefreshToken(refresh);
        }
        setIsAuthenticated(true);
        await loadFeatureFlags();
      } catch (error) {
        const parsedError = parseApiError(error, 'Erro ao autenticar.');
        setAuthError(parsedError);
        throw parsedError;
      }
    },
    [loadFeatureFlags]
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      featureFlags,
      login,
      logout: handleLogout,
      authError,
      clearAuthError,
    }),
    [
      isAuthenticated,
      isLoading,
      featureFlags,
      login,
      handleLogout,
      authError,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
