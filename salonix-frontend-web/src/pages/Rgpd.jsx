import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Rgpd() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const lastUpdated = new Date().toLocaleDateString();

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkTheme(mediaQuery.matches);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('landing-theme')) {
        setIsDarkTheme(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const sections = [
    'controller',
    'collection',
    'purpose',
    'rights',
    'security',
    'contact',
  ];

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDarkTheme ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <header
        className={`sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-md ${isDarkTheme ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('rgpd.back_home')}
          </Link>
          <span
            className={`font-bold text-xl tracking-tight ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}
          >
            TimelyOne
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <h1
            className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
          >
            {t('rgpd.title')}
          </h1>
          <p
            className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {t('rgpd.last_updated', { date: lastUpdated })}
          </p>
        </div>

        <div
          className={`prose prose-slate max-w-none ${isDarkTheme ? 'prose-invert' : ''}`}
        >
          <p
            className={`text-lg leading-relaxed mb-10 border-l-4 border-indigo-500 pl-4 p-4 rounded-r-lg ${isDarkTheme ? 'text-slate-300 bg-indigo-900/10' : 'text-slate-700 bg-indigo-50/50'}`}
          >
            {t('rgpd.intro')}
          </p>

          <div className="space-y-6">
            {sections.map((key) => (
              <section
                key={key}
                className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}
              >
                <h2
                  className={`text-xl font-semibold mb-3 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
                >
                  {t(`rgpd.sections.${key}.title`)}
                </h2>
                <p
                  className={`leading-relaxed text-base ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}
                >
                  {t(`rgpd.sections.${key}.content`)}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer
        className={`mt-12 border-t py-8 text-center text-sm ${isDarkTheme ? 'border-slate-800 text-slate-400 bg-slate-950/50' : 'border-slate-200 text-slate-500 bg-slate-100'}`}
      >
        <p>&copy; {currentYear} Criativo Devs. All rights reserved.</p>
      </footer>
    </div>
  );
}
