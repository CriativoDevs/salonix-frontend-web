/* eslint-env jest */
describe('Service worker offline navigation fallback', () => {
  it('responds with cached index.html when navigate fetch fails', async () => {
    const listeners = {};
    const addSpy = jest
      .spyOn(globalThis, 'addEventListener')
      .mockImplementation((type, cb) => {
        listeners[type] = cb;
      });

    globalThis.caches = {
      match: jest.fn().mockResolvedValue('INDEX_HTML_RESPONSE'),
      open: jest.fn(),
      keys: jest.fn(),
      delete: jest.fn(),
    };
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    await import('../../../public/sw.js');

    const fetchHandler = listeners.fetch;
    expect(typeof fetchHandler).toBe('function');

    const respondWith = jest.fn((p) => p);
    const event = {
      request: {
        mode: 'navigate',
        url: 'http://localhost:3000/some-page',
        headers: new Map(),
      },
      respondWith,
    };

    await fetchHandler(event);

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(globalThis.caches.match).toHaveBeenCalledWith('/index.html');
    expect(respondWith).toHaveBeenCalled();

    addSpy.mockRestore();
  });
});
