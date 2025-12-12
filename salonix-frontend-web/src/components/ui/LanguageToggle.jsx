import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useTenant } from '../../hooks/useTenant';

function FlagIcon({ lang }) {
  const code = lang === 'pt' ? '🇵🇹' : '🇺🇸';
  return <span className="text-base leading-none">{code}</span>;
}

export default function LanguageToggle({ className = '' }) {
  const { slug, tenant } = useTenant();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const check = () => {
      try {
        setIsMobile(window.matchMedia('(max-width: 640px)').matches);
      } catch {
        setIsMobile(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('salonix_lang') : '';
      const hasStored = stored === 'pt' || stored === 'en';
      const defaultLang = String(tenant?.profile?.language || '').trim().toLowerCase();
      if (!hasStored && (defaultLang === 'pt' || defaultLang === 'en')) {
        if (i18n.language !== defaultLang) {
          i18n.changeLanguage(defaultLang);
        }
      }
    } catch {
      /* noop */
    }
  }, [tenant]);

  const track = (event, props = {}) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, props);
        return;
      }
      if (typeof window !== 'undefined' && window.analytics && window.analytics.track) {
        window.analytics.track(event, props);
        return;
      }
      console.log('telemetry:event', event, props);
    } catch {
      /* noop */
    }
  };

  const options = [
    { value: 'pt', label: t('nav.language.pt_label', 'Português (PT‑PT)') },
    { value: 'en', label: t('nav.language.en_label', 'English') },
  ];

  const currentLang = i18n.language === 'en' ? 'en' : 'pt';

  const changeLanguage = async (next) => {
    await i18n.changeLanguage(next);
    setIsOpen(false);
    track('i18n_language_change', { lang: next, tenant_slug: slug || null });
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-0 bg-transparent border-0 text-brand-surfaceForeground underline underline-offset-4 hover:text-brand-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        aria-label={t('nav.change_language', 'Alterar idioma')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FlagIcon lang={currentLang} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 ${isMobile ? 'bottom-full mb-2' : 'top-full mt-2'} w-44 bg-brand-surface border border-brand-border rounded-lg shadow-lg z-50`}
        >
          <div className="py-1">
            {options.map((opt) => {
              const selected = currentLang === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => changeLanguage(opt.value)}
                  className={`w-full flex items-center px-4 py-2 text-sm hover:bg-brand-light transition-colors duration-150 ${
                    selected ? 'bg-brand-light text-brand-surfaceForeground font-medium' : 'text-brand-surfaceForeground'
                  }`}
                  role="menuitem"
                >
                  <FlagIcon lang={opt.value} />
                  <span className="ml-3">{opt.label}</span>
                  {selected && <div className="w-2 h-2 bg-brand-primary rounded-full ml-auto"></div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
