import { createContext } from 'react';

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  featureFlags: null,
  login: async () => {},
  logout: () => {},
  clearAuthError: () => {},
});
