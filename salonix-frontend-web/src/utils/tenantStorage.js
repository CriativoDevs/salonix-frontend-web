import { sanitizeTenantSlug } from './tenant';

const STORAGE_KEY = 'salonix_tenant_slug';

function safeSessionStorage() {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }
  return window.sessionStorage;
}

export function getStoredTenantSlug() {
  const storage = safeSessionStorage();
  if (!storage) return '';
  try {
    const value = storage.getItem(STORAGE_KEY);
    return sanitizeTenantSlug(value);
  } catch (error) {
    console.warn('Não foi possível ler o tenant slug armazenado.', error);
    return '';
  }
}

export function storeTenantSlug(slug) {
  const storage = safeSessionStorage();
  if (!storage) return;
  const sanitized = sanitizeTenantSlug(slug);
  if (!sanitized) return;
  try {
    storage.setItem(STORAGE_KEY, sanitized);
  } catch (error) {
    console.warn('Não foi possível guardar o tenant slug.', error);
  }
}

export function clearStoredTenantSlug() {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Não foi possível limpar o tenant slug.', error);
  }
}
