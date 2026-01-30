import { createContext } from 'react';

export const ClientAuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  customerId: null,
  tenantSlug: null,
  login: () => {},
  logout: () => {},
});
