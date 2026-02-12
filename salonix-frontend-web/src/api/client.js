import axios from 'axios';
import i18n from '../i18n';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  triggerLogout,
} from '../utils/authStorage';
import {
  getClientAccessToken,
  getClientRefreshToken,
  setClientAccessToken,
  setClientRefreshToken,
  clearClientTokens,
} from '../utils/clientAuthStorage';
import { getEnvVar } from '../utils/env';
import { viteEnv } from '../utils/viteEnv';
import { RATE_LIMIT_EVENT } from '../constants/events';

const defaultBase = 'http://localhost:8000/api';

// In Vite, import.meta.env is replaced at build time
// This will be inlined during build, replacing the undefined check
const envBase = viteEnv?.VITE_API_BASE_URL || getEnvVar('VITE_API_BASE_URL');
const configuredBase = envBase || defaultBase;

console.log('API Base URL:', configuredBase);

const mode = String(getEnvVar('MODE', '')).toLowerCase();
const isDev =
  Boolean(getEnvVar('DEV', false)) || mode === 'development' || mode === 'dev';

// Only use proxy in dev if we are actually targeting localhost
const useProxyBase = isDev && /localhost(:\d+)?/i.test(configuredBase);

export const API_BASE_URL = useProxyBase
  ? '/api/'
  : configuredBase.endsWith('/')
    ? configuredBase
    : `${configuredBase}/`;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

client.interceptors.request.use((config) => {
  // Endpoints públicos não devem ter token
  const isPublicEndpoint =
    config.url?.includes('public/') ||
    config.url?.includes('users/tenant/meta/') ||
    config.url?.includes('users/password/reset/') ||
    config.url?.includes('users/password/reset/confirm/');

  if (!isPublicEndpoint) {
    // Prioridade: cliente > owner/staff (áreas separadas)
    const clientToken = getClientAccessToken();
    const staffToken = getAccessToken();

    const token = clientToken || staffToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Marcar qual tipo de token estamos usando
      config._isClientToken = Boolean(clientToken);
    }
  }

  const lang = String(i18n?.language || 'pt').toLowerCase();
  config.headers['Accept-Language'] = lang === 'pt' ? 'pt-PT' : 'en';
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const addPendingRequest = (callback) => {
  pendingRequests.push(callback);
};

const resolvePendingRequests = (token) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response) {
      return Promise.reject(error);
    }

    // Handle 429 Rate Limit
    if (response.status === 429) {
      const retryAfterHeader = response.headers['retry-after'];
      let seconds = 60; // default

      if (retryAfterHeader) {
        seconds = parseInt(retryAfterHeader, 10);
      } else if (response.data && response.data.detail) {
        // DRF often returns: "Request was throttled. Expected available in 56 seconds."
        const match = response.data.detail.match(/available in (\d+) seconds/);
        if (match) {
          seconds = parseInt(match[1], 10);
        }
      }

      // Dispatch event for UI
      window.dispatchEvent(
        new CustomEvent('api-rate-limit', {
          detail: { retryAfter: seconds || 60 },
        })
      );

      return Promise.reject(error);
    }

    if (
      response.status !== 401 ||
      config._retry ||
      config.url.includes('token/')
    ) {
      return Promise.reject(error);
    }

    // Determinar se é token de cliente ou staff
    const isClientToken = config._isClientToken;
    const refresh = isClientToken ? getClientRefreshToken() : getRefreshToken();

    if (!refresh) {
      if (isClientToken) {
        clearClientTokens();
      } else {
        triggerLogout();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addPendingRequest((token) => {
          if (!token) {
            reject(error);
            return;
          }
          config.headers.Authorization = `Bearer ${token}`;
          resolve(client(config));
        });
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      // Usar endpoint correto baseado no tipo de token
      const refreshEndpoint = isClientToken
        ? 'clients/token/refresh/' // Cliente usa endpoint de cliente
        : 'users/token/refresh/'; // Staff usa endpoint de staff

      const { data } = await refreshClient.post(refreshEndpoint, {
        refresh,
      });
      const { access, refresh: newRefresh } = data;

      if (isClientToken) {
        // Renovar tokens de cliente
        if (access) {
          setClientAccessToken(access);
        }
        if (newRefresh) {
          setClientRefreshToken(newRefresh);
        }
      } else {
        // Renovar tokens de staff
        if (access) {
          setAccessToken(access);
        }
        if (newRefresh) {
          setRefreshToken(newRefresh);
        }
      }

      resolvePendingRequests(access || null);
      config.headers.Authorization = access ? `Bearer ${access}` : undefined;
      return client(config);
    } catch (refreshError) {
      resolvePendingRequests(null);
      if (isClientToken) {
        clearClientTokens();
      } else {
        triggerLogout();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
