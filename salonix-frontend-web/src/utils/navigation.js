const REDIRECT_KEY = 'salonix_redirect_after_auth';

function getStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  return window.sessionStorage;
}

export function schedulePostAuthRedirect(path) {
  const storage = getStorage();
  if (!storage || !path) return;
  try {
    storage.setItem(REDIRECT_KEY, path);
  } catch (error) {
    console.warn('[Navigation] Unable to schedule redirect:', error);
  }
}

export function consumePostAuthRedirect() {
  const storage = getStorage();
  if (!storage) return '';
  try {
    const value = storage.getItem(REDIRECT_KEY);
    if (value) {
      storage.removeItem(REDIRECT_KEY);
      return value;
    }
  } catch (error) {
    console.warn('[Navigation] Unable to consume redirect:', error);
  }
  return '';
}

export function clearPostAuthRedirect() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(REDIRECT_KEY);
  } catch (error) {
    console.warn('[Navigation] Unable to clear redirect:', error);
  }
}
