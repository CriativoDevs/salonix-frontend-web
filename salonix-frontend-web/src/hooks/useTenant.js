import { useContext } from 'react';
import TenantContext from '../contexts/TenantContext';

export function useTenantMeta() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantMeta deve ser usado dentro de um TenantProvider.');
  }
  return context;
}

export function useTenant() {
  return useTenantMeta();
}

export default useTenant;
