import client from '../client';

describe('API Client Configuration', () => {
  it('should have withCredentials enabled', () => {
    expect(client.defaults.withCredentials).toBe(true);
  });

  it('should have CSRF cookie name configured', () => {
    expect(client.defaults.xsrfCookieName).toBe('csrftoken');
  });

  it('should have CSRF header name configured', () => {
    expect(client.defaults.xsrfHeaderName).toBe('X-CSRFToken');
  });

  it('should have JSON content type by default', () => {
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });
});
