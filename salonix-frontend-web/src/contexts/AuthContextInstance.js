import { createContext } from 'react';

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  featureFlags: null,
  tenant: null,
  login: async () => {},
  logout: () => {},
  clearAuthError: () => {},
});
