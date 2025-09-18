const REFRESH_KEY = 'salonix_refresh_token';
const ACCESS_KEY = 'salonix_access_token';

let accessToken = sessionStorage.getItem(ACCESS_KEY) || null;
let refreshToken = localStorage.getItem(REFRESH_KEY) || null;
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
    localStorage.setItem(REFRESH_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

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
