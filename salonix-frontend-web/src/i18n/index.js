import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';

const STORAGE_KEY = 'salonix_lang';

function safeLocalStorage() {
  if (
    typeof window === 'undefined' ||
    typeof window.localStorage === 'undefined'
  ) {
    return null;
  }
  return window.localStorage;
}

function readStoredLanguage() {
  try {
    const storage = safeLocalStorage();
    if (!storage) return '';
    const value = String(storage.getItem(STORAGE_KEY) || '')
      .trim()
      .toLowerCase();
    if (value === 'pt' || value === 'en') return value;
    return '';
  } catch {
    return '';
  }
}

function persistLanguage(lang) {
  try {
    const storage = safeLocalStorage();
    if (!storage) return;
    const v = String(lang || '')
      .trim()
      .toLowerCase();
    if (v === 'pt' || v === 'en') {
      storage.setItem(STORAGE_KEY, v);
    }
  } catch {
    // noop
  }
}

const initialLang = readStoredLanguage() || 'pt';

const baseConfig = {
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
};

if (initReactI18next) {
  i18n.use(initReactI18next).init(baseConfig);
} else {
  i18n.init(baseConfig);
}

i18n.on('languageChanged', (lng) => {
  persistLanguage(lng);
});

export default i18n;
