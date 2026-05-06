describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.resetModules();
  });

  it('stores access token in sessionStorage only', () => {
    const { setAccessToken, getAccessToken } = require('../authStorage');

    setAccessToken('access-123');

    expect(getAccessToken()).toBe('access-123');
    expect(sessionStorage.getItem('salonix_access_token')).toBe('access-123');
    expect(localStorage.getItem('salonix_access_token')).toBeNull();
  });

  it('stores refresh token with metadata in localStorage', () => {
    const { setRefreshToken, getRefreshToken } = require('../authStorage');

    setRefreshToken('refresh-123');

    expect(getRefreshToken()).toBe('refresh-123');
    expect(localStorage.getItem('salonix_refresh_token')).toBe('refresh-123');
    expect(localStorage.getItem('salonix_refresh_token_meta')).toBeTruthy();
  });

  it('returns null and clears storage when refresh metadata is expired', () => {
    const oldTs = Date.now() - 15 * 24 * 60 * 60 * 1000;
    localStorage.setItem('salonix_refresh_token', 'refresh-old');
    localStorage.setItem(
      'salonix_refresh_token_meta',
      JSON.stringify({ storedAt: oldTs })
    );

    const { getRefreshToken } = require('../authStorage');

    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem('salonix_refresh_token')).toBeNull();
    expect(localStorage.getItem('salonix_refresh_token_meta')).toBeNull();
  });
});
