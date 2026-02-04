import { useCallback, useEffect, useState } from 'react';
import { ClientAuthContext } from './ClientAuthContextInstance';
import {
  getClientRefreshToken,
  getClientAccessToken,
  setClientAccessToken,
  clearClientTokens,
} from '../utils/clientAuthStorage';
import { refreshClientToken } from '../api/clientAccess';
import { useTenant } from '../hooks/useTenant';

export const ClientAuthProvider = ({ children }) => {
  const { setTenantSlug: updateGlobalTenantSlug } = useTenant();
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
        // Sincronizar tenant_slug do JWT com TenantContext global
        updateGlobalTenantSlug(payload.tenant_slug);
      }
    },
    [decodeToken, updateGlobalTenantSlug]
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
          // Sincronizar tenant_slug do JWT com TenantContext global
          updateGlobalTenantSlug(payload.tenant_slug);
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
            // Sincronizar tenant_slug do JWT com TenantContext global
            updateGlobalTenantSlug(payload.tenant_slug);
          }
        }
      } catch (error) {
        const status = error?.response?.status;
        // 500 = endpoint errado (também indica token inválido para o contexto)
        if (status === 401 || status === 403 || status === 500) {
          console.warn(
            '[ClientAuth] refresh failed (status: ' +
              status +
              '), clearing tokens'
          );
          clearClientTokens();
        } else {
          console.warn(
            '[ClientAuth] refresh failed with network error, keeping tokens:',
            error
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [decodeToken, updateGlobalTenantSlug]);

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
