describe('clientAuthStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.resetModules();
  });

  it('stores client access token in sessionStorage only', () => {
    const {
      setClientAccessToken,
      getClientAccessToken,
    } = require('../clientAuthStorage');

    setClientAccessToken('client-access');

    expect(getClientAccessToken()).toBe('client-access');
    expect(sessionStorage.getItem('client_access_token')).toBe('client-access');
    expect(localStorage.getItem('client_access_token')).toBeNull();
  });

  it('stores client refresh token with metadata in localStorage', () => {
    const {
      setClientRefreshToken,
      getClientRefreshToken,
    } = require('../clientAuthStorage');

    setClientRefreshToken('client-refresh');

    expect(getClientRefreshToken()).toBe('client-refresh');
    expect(localStorage.getItem('client_refresh_token')).toBe('client-refresh');
    expect(localStorage.getItem('client_refresh_token_meta')).toBeTruthy();
  });

  it('returns null and clears storage when client refresh metadata is expired', () => {
    const oldTs = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem('client_refresh_token', 'client-refresh-old');
    localStorage.setItem(
      'client_refresh_token_meta',
      JSON.stringify({ storedAt: oldTs })
    );

    const { getClientRefreshToken } = require('../clientAuthStorage');

    expect(getClientRefreshToken()).toBeNull();
    expect(localStorage.getItem('client_refresh_token')).toBeNull();
    expect(localStorage.getItem('client_refresh_token_meta')).toBeNull();
  });
});
