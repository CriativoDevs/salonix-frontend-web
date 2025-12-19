import { useContext } from 'react';
import { OpsAuthContext } from '../contexts/OpsAuthContextInstance';

export const useOpsAuth = () => {
  const context = useContext(OpsAuthContext);
  if (!context) {
    throw new Error('useOpsAuth must be used within an OpsAuthProvider');
  }
  return context;
};
