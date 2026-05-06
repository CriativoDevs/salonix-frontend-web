/* eslint-env jest */
import {
  isAllowedRedirectUrl,
  isRedirectValidationError,
  REDIRECT_VALIDATION_ERROR_CODE,
  safeRedirect,
} from '../safeRedirect';
import { resetEnvCache } from '../env';

describe('safeRedirect', () => {
  const originalEnv = process.env.VITE_ALLOWED_REDIRECT_HOSTS;

  beforeEach(() => {
    process.env.VITE_ALLOWED_REDIRECT_HOSTS =
      'checkout.stripe.com,billing.stripe.com';
    resetEnvCache();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.VITE_ALLOWED_REDIRECT_HOSTS;
    } else {
      process.env.VITE_ALLOWED_REDIRECT_HOSTS = originalEnv;
    }
    resetEnvCache();
    jest.restoreAllMocks();
  });

  it('permite URL https para host configurado', () => {
    expect(
      isAllowedRedirectUrl('https://checkout.stripe.com/pay/cs_test_123')
    ).toBe(true);
  });

  it('bloqueia URL com protocolo inseguro', () => {
    expect(
      isAllowedRedirectUrl('http://checkout.stripe.com/pay/cs_test_123')
    ).toBe(false);
  });

  it('bloqueia URL com host não permitido', () => {
    expect(
      isAllowedRedirectUrl('https://evil.example.com/pay/cs_test_123')
    ).toBe(false);
  });

  it('lança erro tipado quando tenta redirecionar para URL inválida', () => {
    expect.assertions(3);

    try {
      safeRedirect('https://evil.example.com/pay/cs_test_123');
    } catch (error) {
      expect(isRedirectValidationError(error)).toBe(true);
      expect(error.code).toBe(REDIRECT_VALIDATION_ERROR_CODE);
      expect(error.blockedUrl).toBe('https://evil.example.com/pay/cs_test_123');
    }
  });
});
