import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { OpsAuthContext } from './OpsAuthContextInstance';

export const OpsAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Ref to hold current user state for interceptors without triggering re-renders/re-creations
  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Token management helpers
  const getAccessToken = React.useCallback(
    () => localStorage.getItem('ops_access_token'),
    []
  );
  const getRefreshToken = React.useCallback(
    () => localStorage.getItem('ops_refresh_token'),
    []
  );

  const setTokens = React.useCallback((access, refresh) => {
    if (access) localStorage.setItem('ops_access_token', access);
    if (refresh) localStorage.setItem('ops_refresh_token', refresh);
  }, []);

  const clearTokens = React.useCallback(() => {
    localStorage.removeItem('ops_access_token');
    localStorage.removeItem('ops_refresh_token');
    setUser(null);
  }, []);

  // Create api instance once with request interceptor
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: '/api/ops',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add Authorization header to every request
    instance.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (userRef.current) {
          // We think we are logged in, but have no token. This is a state inconsistency.
          // Cancel request and logout.
          clearTokens();
          // We can't navigate here easily without causing side effects or using unstable navigate ref
          // But since clearTokens clears user, the UI should react.
          window.location.href = '/ops/login';

          // Cancel request
          const controller = new AbortController();
          config.signal = controller.signal;
          controller.abort('No token found');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return instance;
  }, [getAccessToken, clearTokens]);

  // Setup response interceptor for token refresh
  useEffect(() => {
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });

      failedQueue = [];
    };

    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refresh = getRefreshToken();
            if (!refresh) throw new Error('No refresh token');

            // We need to use a separate instance or plain axios to avoid interceptor loop
            // But we can just use axios directly
            const response = await axios.post('/api/ops/auth/refresh/', {
              refresh,
            });

            const { access } = response.data;
            setTokens(access);

            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            originalRequest.headers.Authorization = `Bearer ${access}`;

            processQueue(null, access);

            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            clearTokens();
            navigate('/ops/login');
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, [api, navigate, getRefreshToken, setTokens, clearTokens]);

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me/');
        setUser(response.data);
      } catch (err) {
        console.error('Ops auth check failed', err);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [api, getAccessToken, clearTokens]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh, ops_role, user_id } = response.data;

      setTokens(access, refresh);

      setUser({
        id: user_id,
        username,
        ops_role,
      });

      navigate('/ops/dashboard');
      return true;
    } catch (err) {
      console.error('Ops login failed', err);
      setError(err.response?.data?.message || 'Falha no login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    navigate('/ops/login');
  };

  return (
    <OpsAuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        api,
      }}
    >
      {children}
    </OpsAuthContext.Provider>
  );
};
