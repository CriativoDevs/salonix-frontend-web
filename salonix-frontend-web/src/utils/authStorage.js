const REFRESH_KEY = 'salonix_refresh_token';
const REFRESH_META_KEY = 'salonix_refresh_token_meta';
const ACCESS_KEY = 'salonix_access_token';
const STAFF_REFRESH_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

let accessToken = sessionStorage.getItem(ACCESS_KEY) || null;

const clearStoredRefreshToken = () => {
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_META_KEY);
};

const writeStoredRefreshToken = (token) => {
  if (!token) {
    clearStoredRefreshToken();
    return;
  }

  localStorage.setItem(REFRESH_KEY, token);
  localStorage.setItem(
    REFRESH_META_KEY,
    JSON.stringify({ storedAt: Date.now() })
  );
};

const readStoredRefreshToken = () => {
  const token = localStorage.getItem(REFRESH_KEY);
  if (!token) {
    clearStoredRefreshToken();
    return null;
  }

  const rawMeta = localStorage.getItem(REFRESH_META_KEY);
  if (!rawMeta) {
    // Migração suave: token legado sem metadados recebe timestamp atual.
    writeStoredRefreshToken(token);
    return token;
  }

  try {
    const parsedMeta = JSON.parse(rawMeta);
    const storedAt = Number(parsedMeta?.storedAt);
    if (
      !Number.isFinite(storedAt) ||
      Date.now() - storedAt > STAFF_REFRESH_MAX_AGE_MS
    ) {
      clearStoredRefreshToken();
      return null;
    }
    return token;
  } catch {
    clearStoredRefreshToken();
    return null;
  }
};

let refreshToken = readStoredRefreshToken();
let logoutHandler = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
  if (token) {
    sessionStorage.setItem(ACCESS_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
  }
};

export const setRefreshToken = (token) => {
  refreshToken = token || null;
  if (token) {
    writeStoredRefreshToken(token);
  } else {
    clearStoredRefreshToken();
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => {
  refreshToken = readStoredRefreshToken();
  return refreshToken;
};

export const clearTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
};

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const triggerLogout = () => {
  clearTokens();
  if (typeof logoutHandler === 'function') {
    logoutHandler();
  }
};
