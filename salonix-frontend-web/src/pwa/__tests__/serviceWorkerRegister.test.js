/* eslint-env jest */
describe('Service worker registration', () => {
  it('registers sw.js on window load', async () => {
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: { register: jest.fn().mockResolvedValue({}) },
      configurable: true,
    });

    const { registerServiceWorker } = await import('../registerSw');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    await Promise.resolve();
    expect(globalThis.navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });
});
