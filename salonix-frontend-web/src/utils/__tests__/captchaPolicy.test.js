/* eslint-env jest, node */
import {
  getCaptchaBypassToken,
  getCaptchaTokenForRequest,
  isProductionEnvironment,
  resetCaptchaPolicyCacheForTests,
} from '../captchaPolicy';
import { resetEnvCache } from '../env';

describe('captchaPolicy', () => {
  const originalMode = process.env.MODE;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalProd = process.env.PROD;
  const originalViteAppEnv = process.env.VITE_APP_ENV;
  const originalBypass = process.env.VITE_CAPTCHA_BYPASS_TOKEN;

  beforeEach(() => {
    delete process.env.MODE;
    delete process.env.NODE_ENV;
    delete process.env.PROD;
    delete process.env.VITE_APP_ENV;
    delete process.env.VITE_CAPTCHA_BYPASS_TOKEN;

    resetEnvCache();
    resetCaptchaPolicyCacheForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  afterAll(() => {
    if (originalMode === undefined) {
      delete process.env.MODE;
    } else {
      process.env.MODE = originalMode;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalProd === undefined) {
      delete process.env.PROD;
    } else {
      process.env.PROD = originalProd;
    }

    if (originalViteAppEnv === undefined) {
      delete process.env.VITE_APP_ENV;
    } else {
      process.env.VITE_APP_ENV = originalViteAppEnv;
    }

    if (originalBypass === undefined) {
      delete process.env.VITE_CAPTCHA_BYPASS_TOKEN;
    } else {
      process.env.VITE_CAPTCHA_BYPASS_TOKEN = originalBypass;
    }

    resetEnvCache();
    resetCaptchaPolicyCacheForTests();
  });

  it('recognizes production environment by MODE', () => {
    process.env.MODE = 'production';
    resetEnvCache();

    expect(isProductionEnvironment()).toBe(true);
  });

  it('returns bypass token outside production', () => {
    process.env.MODE = 'development';
    process.env.VITE_CAPTCHA_BYPASS_TOKEN = 'dev-bypass';
    resetEnvCache();

    expect(getCaptchaBypassToken()).toBe('dev-bypass');
    expect(console.warn).toHaveBeenCalledWith(
      '[Captcha] Captcha bypass token is active in non-production mode.'
    );
  });

  it('blocks bypass token in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_CAPTCHA_BYPASS_TOKEN = 'prod-should-not-pass';
    resetEnvCache();

    expect(getCaptchaBypassToken()).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      '[Captcha] VITE_CAPTCHA_BYPASS_TOKEN is configured but ignored in production.'
    );
  });

  it('prefers explicit captcha token over bypass', () => {
    process.env.MODE = 'development';
    process.env.VITE_CAPTCHA_BYPASS_TOKEN = 'dev-bypass';
    resetEnvCache();

    expect(getCaptchaTokenForRequest('captcha-widget-token')).toBe(
      'captcha-widget-token'
    );
  });

  it('uses bypass token when explicit token is not provided', () => {
    process.env.MODE = 'development';
    process.env.VITE_CAPTCHA_BYPASS_TOKEN = 'dev-bypass';
    resetEnvCache();

    expect(getCaptchaTokenForRequest(undefined)).toBe('dev-bypass');
  });
});
