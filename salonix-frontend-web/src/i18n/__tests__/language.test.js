/* eslint-env jest */

describe('i18n language persistence and rendering', () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
  });

  test('initializes from localStorage', async () => {
    window.localStorage.setItem('salonix_lang', 'en');
    const i18n = (await import('../index')).default;
    expect(i18n.language).toBe('en');
    expect(i18n.t('login.title')).toMatch(/Sign in/i);
  });

  test('persists language on change and renders translations', async () => {
    const i18n = (await import('../index')).default;
    expect(i18n.language).toBe('pt');
    expect(i18n.t('login.title')).toMatch(/Entrar/i);

    await i18n.changeLanguage('en');
    expect(window.localStorage.getItem('salonix_lang')).toBe('en');
    expect(i18n.t('login.title')).toMatch(/Sign in/i);

    await i18n.changeLanguage('pt');
    expect(window.localStorage.getItem('salonix_lang')).toBe('pt');
    expect(i18n.t('login.title')).toMatch(/Entrar/i);
  });
});

