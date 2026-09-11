import { createElement, useEffect, useRef, useState } from 'react';
import { Check, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { THEMES } from '../../constants/themes';
import { useTenant } from '../../hooks/useTenant';
import { useTheme } from '../../hooks/useTheme';
import { MoonIcon, SunIcon, SystemIcon } from './icons/ThemeIcons';

function FlagIcon({ lang }) {
  return (
    <span className="text-base leading-none">
      {lang === 'pt' ? 'PT' : 'EN'}
    </span>
  );
}

export default function PreferencesMenu({ className = '' }) {
  const { slug, tenant } = useTenant();
  const { theme, changeTheme, isLoading } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('bottom');
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      const stored = window.localStorage?.getItem('salonix_lang');
      const defaultLang = String(tenant?.profile?.language || '')
        .trim()
        .toLowerCase();
      if (
        !['pt', 'en'].includes(stored) &&
        ['pt', 'en'].includes(defaultLang)
      ) {
        i18n.changeLanguage(defaultLang);
      }
    } catch {
      /* noop */
    }
  }, [tenant]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const themeOptions = [
    {
      value: THEMES.LIGHT,
      label: t('nav.theme.light', 'Claro'),
      icon: SunIcon,
    },
    {
      value: THEMES.DARK,
      label: t('nav.theme.dark', 'Escuro'),
      icon: MoonIcon,
    },
    {
      value: THEMES.SYSTEM,
      label: t('nav.theme.system', 'Sistema'),
      icon: SystemIcon,
    },
  ];
  const languageOptions = [
    { value: 'pt', label: t('nav.language.pt_label', 'Português (PT-PT)') },
    { value: 'en', label: t('nav.language.en_label', 'English') },
  ];
  const currentLanguage = i18n.language === 'en' ? 'en' : 'pt';

  const openMenu = () => {
    const rect = menuRef.current?.getBoundingClientRect();
    if (rect)
      setPosition(window.innerHeight - rect.bottom < 320 ? 'top' : 'bottom');
    setIsOpen(true);
  };

  const changeLanguage = async (nextLanguage) => {
    setIsOpen(false);
    await i18n.changeLanguage(nextLanguage);
    try {
      window.analytics?.track?.('i18n_language_change', {
        lang: nextLanguage,
        tenant_slug: slug || null,
      });
    } catch {
      /* noop */
    }
  };

  const handleThemeChange = (nextTheme) => {
    setIsOpen(false);
    changeTheme(nextTheme);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-brand-primary transition-colors hover:bg-brand-light hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        title={t('nav.settings', 'Configurações')}
        aria-label={t('nav.settings', 'Configurações')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Settings2 className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-60 border border-brand-border bg-brand-surface shadow-lg ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          role="menu"
          aria-label={t('nav.settings', 'Configurações')}
        >
          <section
            className="p-2"
            aria-label={t('nav.change_theme', 'Alterar tema')}
          >
            <p className="px-2 pb-1 text-xs font-semibold uppercase text-brand-surfaceForeground/70">
              {t('nav.change_theme', 'Alterar tema')}
            </p>
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleThemeChange(value)}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center gap-3 px-2 text-left text-sm text-brand-surfaceForeground transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
                  role="menuitemradio"
                  aria-checked={selected}
                >
                  {createElement(Icon, {
                    className: 'h-4 w-4 shrink-0',
                    'aria-hidden': true,
                  })}
                  <span className="flex-1">{label}</span>
                  {selected && (
                    <Check
                      className="h-4 w-4 text-brand-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </section>
          <div className="border-t border-brand-border" />
          <section
            className="p-2"
            aria-label={t('nav.change_language', 'Alterar idioma')}
          >
            <p className="px-2 pb-1 text-xs font-semibold uppercase text-brand-surfaceForeground/70">
              {t('nav.change_language', 'Alterar idioma')}
            </p>
            {languageOptions.map(({ value, label }) => {
              const selected = currentLanguage === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeLanguage(value)}
                  className="flex min-h-11 w-full items-center gap-3 px-2 text-left text-sm text-brand-surfaceForeground transition-colors hover:bg-brand-light"
                  role="menuitemradio"
                  aria-checked={selected}
                >
                  <FlagIcon lang={value} />
                  <span className="flex-1">{label}</span>
                  {selected && (
                    <Check
                      className="h-4 w-4 text-brand-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
