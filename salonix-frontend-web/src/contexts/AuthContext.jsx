import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const auth = { isAuthenticated: true };
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
