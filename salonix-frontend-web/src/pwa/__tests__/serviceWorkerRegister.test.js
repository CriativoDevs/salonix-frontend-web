/* eslint-env jest */
describe('Service worker registration', () => {
  it('registers sw.js on window load', async () => {
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({}),
        addEventListener: jest.fn(),
      },
      configurable: true,
    });

    const { registerServiceWorker } = await import('../registerSw');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    await Promise.resolve();
    expect(globalThis.navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('reloads the page once when a new service worker takes control', async () => {
    let controllerChangeHandler;
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({}),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'controllerchange') controllerChangeHandler = handler;
        }),
      },
      configurable: true,
    });
    const reloadMock = jest.fn();

    const { registerServiceWorker } = await import('../registerSw');
    registerServiceWorker(reloadMock);
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(typeof controllerChangeHandler).toBe('function');
    controllerChangeHandler();
    controllerChangeHandler();

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
