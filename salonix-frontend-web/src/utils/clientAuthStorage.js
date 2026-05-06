/**
 * Gerenciamento de tokens JWT para autenticação de clientes.
 *
 * Estratégia de hardening:
 * - Access token em sessionStorage (menor persistência)
 * - Refresh token em localStorage com expiração local por metadados
 *
 * Fluxo esperado:
 * - Ao reabrir app, access pode não existir (sessionStorage vazio)
 * - Refresh válido permite restaurar sessão via endpoint de refresh
 */

const CLIENT_ACCESS_KEY = 'client_access_token';
const CLIENT_REFRESH_KEY = 'client_refresh_token';
const CLIENT_REFRESH_META_KEY = 'client_refresh_token_meta';
const CLIENT_REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Estado em memória (cache)
let accessToken = null;
let refreshToken = null;

const clearStoredRefreshToken = () => {
  localStorage.removeItem(CLIENT_REFRESH_KEY);
  localStorage.removeItem(CLIENT_REFRESH_META_KEY);
};

const writeStoredRefreshToken = (token) => {
  if (!token) {
    clearStoredRefreshToken();
    return;
  }

  localStorage.setItem(CLIENT_REFRESH_KEY, token);
  localStorage.setItem(
    CLIENT_REFRESH_META_KEY,
    JSON.stringify({ storedAt: Date.now() })
  );
};

const readStoredRefreshToken = () => {
  const token = localStorage.getItem(CLIENT_REFRESH_KEY);
  if (!token) {
    clearStoredRefreshToken();
    return null;
  }

  const rawMeta = localStorage.getItem(CLIENT_REFRESH_META_KEY);
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
      Date.now() - storedAt > CLIENT_REFRESH_MAX_AGE_MS
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

/**
 * Inicializar tokens da storage ao carregar o módulo
 */
function initializeTokens() {
  try {
    accessToken = sessionStorage.getItem(CLIENT_ACCESS_KEY) || null;
    refreshToken = readStoredRefreshToken();
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
 * Armazenado em sessionStorage para reduzir persistência desnecessária
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
 * Armazenado em localStorage com metadados de expiração local
 */
export const setClientRefreshToken = (token) => {
  refreshToken = token || null;
  try {
    if (token) {
      writeStoredRefreshToken(token);
    } else {
      clearStoredRefreshToken();
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
  try {
    refreshToken = readStoredRefreshToken();
  } catch (error) {
    console.error('Error getting client refresh token:', error);
    refreshToken = null;
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
