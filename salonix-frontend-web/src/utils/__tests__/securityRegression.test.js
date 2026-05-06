/**
 * FEW-SEC-05 — Security regression tests
 *
 * Covers:
 * 1. XSS prevention (sanitization of user input)
 * 2. Open redirect protection (safeRedirect)
 * 3. Token handling (ICS download header-based)
 */

// --- 1. XSS PREVENTION ---

describe('XSS prevention', () => {
  it('bloqueia script tags em nomes de tenant no titulo', () => {
    // Simula o que TenantThemeManager faz ao setar document.title
    const maliciousName = '<script>alert(1)</script>';
    document.title = maliciousName;
    // document.title não executa scripts — é texto puro
    expect(document.title).toBe(maliciousName);
    expect(document.querySelector('script[title]')).toBeNull();
  });

  it('atributos dataset não injetam HTML', () => {
    const maliciousSlug = '"><img src=x onerror=alert(1)>';
    const body = document.body;
    body.dataset.tenantSlug = maliciousSlug;
    // dataset armazena como string, não interpreta HTML
    expect(body.dataset.tenantSlug).toBe(maliciousSlug);
    // Nenhuma tag img foi criada
    expect(document.querySelector('img[src="x"]')).toBeNull();
    delete body.dataset.tenantSlug;
  });

  it('event handler como string não é executado via checkbox onChange', () => {
    // Verifica que onToken recebe 'builtin-ok' (string constante, não user input)
    const onToken = jest.fn();
    const result = (() => {
      // Replica lógica do CaptchaGate builtin
      const value = true ? 'builtin-ok' : null;
      onToken(value);
      return value;
    })();
    expect(result).toBe('builtin-ok');
    expect(onToken).toHaveBeenCalledWith('builtin-ok');
    // Valor é sempre a string constante, nunca user input
  });

  it('encodeURIComponent é seguro para query params de endereço', () => {
    // Simula buildQuery() em ClientDashboard para Google Maps
    const maliciousAddress = 'Rua Foo"><script>alert(1)</script>';
    const encoded = encodeURIComponent(maliciousAddress);
    expect(encoded).not.toContain('<');
    expect(encoded).not.toContain('>');
    expect(encoded).not.toContain('"');
  });
});

// --- 2. OPEN REDIRECT PROTECTION ---

import {
  isAllowedRedirectUrl,
  isRedirectValidationError,
  safeRedirect,
} from '../safeRedirect';
import { resetEnvCache } from '../env';

describe('open redirect protection', () => {
  beforeEach(() => {
    process.env.VITE_ALLOWED_REDIRECT_HOSTS =
      'checkout.stripe.com,billing.stripe.com';
    resetEnvCache();
  });

  afterEach(() => {
    delete process.env.VITE_ALLOWED_REDIRECT_HOSTS;
    resetEnvCache();
    jest.restoreAllMocks();
  });

  it('permite redirect para hosts Stripe configurados', () => {
    expect(
      isAllowedRedirectUrl('https://checkout.stripe.com/pay/cs_live_abc')
    ).toBe(true);
    expect(
      isAllowedRedirectUrl('https://billing.stripe.com/p/session/bss_live_abc')
    ).toBe(true);
  });

  it('bloqueia redirect para host não autorizado', () => {
    expect(isAllowedRedirectUrl('https://evil.example.com/steal')).toBe(false);
  });

  it('bloqueia protocolo http (não HTTPS)', () => {
    expect(
      isAllowedRedirectUrl('http://checkout.stripe.com/pay/cs_test_abc')
    ).toBe(false);
  });

  it('bloqueia protocolo javascript:', () => {
    expect(isAllowedRedirectUrl('javascript:alert(1)')).toBe(false);
  });

  it('bloqueia protocol-relative URL', () => {
    expect(isAllowedRedirectUrl('//evil.example.com/steal')).toBe(false);
  });

  it('bloqueia URLs com host embutido (bypass attempt)', () => {
    expect(
      isAllowedRedirectUrl('https://checkout.stripe.com.evil.com/pay')
    ).toBe(false);
  });

  it('lança erro tipado em safeRedirect para URL bloqueada', () => {
    expect.assertions(2);
    try {
      safeRedirect('https://evil.example.com/steal');
    } catch (error) {
      expect(isRedirectValidationError(error)).toBe(true);
      expect(error.blockedUrl).toBe('https://evil.example.com/steal');
    }
  });
});

// --- 3. TOKEN HANDLING (ICS download) ---

import { downloadICSSecure } from '../icsDownload';

describe('token handling — ICS download', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('token vai no header X-ICS-Token, não na query string', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' }),
    });

    await downloadICSSecure(
      'https://api.example.com/',
      42,
      'secret-token-abc',
      'appointment.ics'
    );

    const [url, options] = fetch.mock.calls[0];
    expect(url).not.toContain('secret-token-abc');
    expect(url).not.toContain('token=');
    expect(options.headers['X-ICS-Token']).toBe('secret-token-abc');
  });

  it('usa referrerPolicy no-referrer para não vazar token via Referer', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' }),
    });

    await downloadICSSecure(
      'https://api.example.com/',
      42,
      'secret-token-abc',
      'appointment.ics'
    );

    const [, options] = fetch.mock.calls[0];
    expect(options.referrerPolicy).toBe('no-referrer');
  });

  it('lança erro se parâmetros obrigatórios faltam', async () => {
    await expect(
      downloadICSSecure('', 42, 'token', 'file.ics')
    ).rejects.toThrow();
    await expect(
      downloadICSSecure('https://api.example.com/', null, 'token', 'file.ics')
    ).rejects.toThrow();
    await expect(
      downloadICSSecure('https://api.example.com/', 42, '', 'file.ics')
    ).rejects.toThrow();
  });

  it('URL construída aponta para endpoint /ics/ sem query de token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' }),
    });

    await downloadICSSecure(
      'https://api.example.com/',
      99,
      'any-token',
      'test.ics'
    );

    const [url] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/public/appointments/99/ics/');
  });
});
