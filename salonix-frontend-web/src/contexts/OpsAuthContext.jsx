import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { OpsAuthContext } from './OpsAuthContextInstance';

export const OpsAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Token management helpers
  const getAccessToken = () => localStorage.getItem('ops_access_token');
  const getRefreshToken = () => localStorage.getItem('ops_refresh_token');

  const setTokens = (access, refresh) => {
    if (access) localStorage.setItem('ops_access_token', access);
    if (refresh) localStorage.setItem('ops_refresh_token', refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem('ops_access_token');
    localStorage.removeItem('ops_refresh_token');
    setUser(null);
  };

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
        } else if (user) {
          // We think we are logged in, but have no token. This is a state inconsistency.
          // Cancel request and logout.
          clearTokens();
          navigate('/ops/login');
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
  }, []);

  // Setup response interceptor for token refresh
  useEffect(() => {
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

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

            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          } catch (refreshError) {
            clearTokens();
            navigate('/ops/login');
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, [api, navigate]);

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
  }, [api]);

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
