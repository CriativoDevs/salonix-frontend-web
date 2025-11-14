import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  triggerLogout,
} from '../utils/authStorage';
import { getEnvVar } from '../utils/env';

// Base da API: usa env `VITE_API_URL` com fallback para localhost
const defaultBase = 'http://localhost:8000/api/';
const configuredBase = getEnvVar('VITE_API_URL', defaultBase) || defaultBase;
export const API_BASE_URL = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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

    if (response.status !== 401 || config._retry || config.url.includes('token/')) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      triggerLogout();
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
      const { data } = await refreshClient.post('users/token/refresh/', { refresh });
      const { access, refresh: newRefresh } = data;
      if (access) {
        setAccessToken(access);
      }
      if (newRefresh) {
        setRefreshToken(newRefresh);
      }
      resolvePendingRequests(access || null);
      config.headers.Authorization = access ? `Bearer ${access}` : undefined;
      return client(config);
    } catch (refreshError) {
      resolvePendingRequests(null);
      triggerLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
