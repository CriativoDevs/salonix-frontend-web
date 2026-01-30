import { useCallback, useEffect, useState } from 'react';
import { ClientAuthContext } from './ClientAuthContextInstance';
import {
  getClientRefreshToken,
  getClientAccessToken,
  setClientAccessToken,
  clearClientTokens,
} from '../utils/clientAuthStorage';
import { refreshClientToken } from '../api/clientAccess';

export const ClientAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const [tenantSlug, setTenantSlug] = useState(null);

  const handleLogout = useCallback(() => {
    clearClientTokens();
    setIsAuthenticated(false);
    setCustomerId(null);
    setTenantSlug(null);
  }, []);

  // Decodificar JWT para extrair customer_id e tenant_slug (sem validar assinatura)
  const decodeToken = useCallback((token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }, []);

  // Marcar cliente como autenticado após login
  const handleLogin = useCallback(
    (accessToken) => {
      const payload = decodeToken(accessToken);
      if (payload?.customer_id && payload?.tenant_slug) {
        setIsAuthenticated(true);
        setCustomerId(payload.customer_id);
        setTenantSlug(payload.tenant_slug);
      }
    },
    [decodeToken]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const storedRefresh = getClientRefreshToken();
      const storedAccess = getClientAccessToken();

      if (!storedRefresh) {
        setIsLoading(false);
        return;
      }

      // Se temos access token válido, decodificar e marcar como autenticado
      if (storedAccess) {
        const payload = decodeToken(storedAccess);
        if (payload?.customer_id && payload?.tenant_slug) {
          setIsAuthenticated(true);
          setCustomerId(payload.customer_id);
          setTenantSlug(payload.tenant_slug);
          setIsLoading(false);
          return;
        }
      }

      // Caso contrário, tentar renovar access token
      try {
        const { access } = await refreshClientToken(storedRefresh);
        if (access) {
          setClientAccessToken(access);
          const payload = decodeToken(access);
          if (payload?.customer_id && payload?.tenant_slug) {
            setIsAuthenticated(true);
            setCustomerId(payload.customer_id);
            setTenantSlug(payload.tenant_slug);
          }
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          console.warn(
            '[ClientAuth] refresh token invalid/expired, clearing tokens'
          );
          clearClientTokens();
        } else {
          console.warn(
            '[ClientAuth] refresh token failed with non-auth error (network?), keeping tokens:',
            error
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [decodeToken]);

  const value = {
    isAuthenticated,
    isLoading,
    customerId,
    tenantSlug,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
