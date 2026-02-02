/* eslint-env jest */
describe('Service worker version update behavior', () => {
  it('deletes old caches and claims clients on activate', async () => {
    const listeners = {};
    const addSpy = jest
      .spyOn(globalThis, 'addEventListener')
      .mockImplementation((type, cb) => {
        listeners[type] = cb;
      });

    globalThis.caches = {
      keys: jest
        .fn()
        .mockResolvedValue(['old-cache', 'timelyone-app-shell-v2']),
      delete: jest.fn().mockResolvedValue(true),
      open: jest.fn(),
      match: jest.fn(),
    };

    const clientsClaim = jest.fn();
    globalThis.self = globalThis.self || globalThis;
    globalThis.self.clients = { claim: clientsClaim };
    globalThis.self.skipWaiting = jest.fn();

    await import('../../../public/sw.js');

    const activateHandler = listeners.activate;
    expect(typeof activateHandler).toBe('function');

    const waitUntil = (p) => p;
    await activateHandler({ waitUntil });
    await new Promise((r) => setTimeout(r, 0));

    expect(globalThis.caches.keys).toHaveBeenCalled();
    expect(globalThis.caches.delete).toHaveBeenCalledWith('old-cache');
    expect(globalThis.caches.delete).not.toHaveBeenCalledWith(
      'salonix-app-shell-v1'
    );
    expect(clientsClaim).toHaveBeenCalled();

    addSpy.mockRestore();
  });
});
