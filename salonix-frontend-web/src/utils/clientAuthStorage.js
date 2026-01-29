/**
 * Gerenciamento de tokens JWT para autenticação de clientes.
 *
 * Segue o mesmo padrão de authStorage.js (admin/staff):
 * - Access token em sessionStorage (sobrevive a reloads, não sobrevive a fechar o browser)
 * - Refresh token em localStorage (persiste entre sessões)
 *
 * IMPORTANTE: iOS em modo standalone (PWA) tem comportamento diferente:
 * - localStorage pode ser limpo ao fechar o app
 * - sessionStorage funciona melhor para access tokens
 */

const CLIENT_ACCESS_KEY = 'client_access_token';
const CLIENT_REFRESH_KEY = 'client_refresh_token';

// Estado em memória (cache)
let accessToken = null;
let refreshToken = null;

/**
 * Inicializar tokens da storage ao carregar o módulo
 */
function initializeTokens() {
  try {
    accessToken = sessionStorage.getItem(CLIENT_ACCESS_KEY) || null;
    refreshToken = localStorage.getItem(CLIENT_REFRESH_KEY) || null;
  } catch (error) {
    console.error('Error initializing client tokens:', error);
    accessToken = null;
    refreshToken = null;
  }
}

// Inicializar ao carregar módulo
initializeTokens();

/**
 * Define o access token (JWT de curta duração)
 * Armazenado em sessionStorage para sobreviver a reloads mas não ao fechar o browser
 */
export const setClientAccessToken = (token) => {
  accessToken = token || null;
  try {
    if (token) {
      sessionStorage.setItem(CLIENT_ACCESS_KEY, token);
    } else {
      sessionStorage.removeItem(CLIENT_ACCESS_KEY);
    }
  } catch (error) {
    console.error('Error setting client access token:', error);
  }
};

/**
 * Define o refresh token (JWT de longa duração)
 * Armazenado em localStorage para persistir entre sessões
 */
export const setClientRefreshToken = (token) => {
  refreshToken = token || null;
  try {
    if (token) {
      localStorage.setItem(CLIENT_REFRESH_KEY, token);
    } else {
      localStorage.removeItem(CLIENT_REFRESH_KEY);
    }
  } catch (error) {
    console.error('Error setting client refresh token:', error);
  }
};

/**
 * Retorna o access token atual
 */
export const getClientAccessToken = () => {
  // Se não temos em memória, tentar ler do sessionStorage
  if (!accessToken) {
    try {
      accessToken = sessionStorage.getItem(CLIENT_ACCESS_KEY) || null;
    } catch (error) {
      console.error('Error getting client access token:', error);
    }
  }
  return accessToken;
};

/**
 * Retorna o refresh token atual
 */
export const getClientRefreshToken = () => {
  // Se não temos em memória, tentar ler do localStorage
  if (!refreshToken) {
    try {
      refreshToken = localStorage.getItem(CLIENT_REFRESH_KEY) || null;
    } catch (error) {
      console.error('Error getting client refresh token:', error);
    }
  }
  return refreshToken;
};

/**
 * Limpa ambos os tokens
 */
export const clearClientTokens = () => {
  setClientAccessToken(null);
  setClientRefreshToken(null);
};

/**
 * Verifica se há um cliente autenticado (tem access token)
 */
export const hasClientAuth = () => {
  return !!getClientAccessToken();
};
