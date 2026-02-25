import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, Smartphone, Zap, Wifi, Download } from 'lucide-react';

export default function PwaInfo() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

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

  const features = [
    {
      icon: Download,
      key: 'no_store',
    },
    {
      icon: Zap,
      key: 'lightweight',
    },
    {
      icon: Wifi,
      key: 'offline',
    },
    {
      icon: Smartphone,
      key: 'native_feel',
    },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkTheme ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-md ${isDarkTheme ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('pwa_info.back_home', 'Voltar para Início')}
          </Link>
          <span className={`font-bold text-xl tracking-tight ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
            TimelyOne
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12 text-center">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkTheme ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            {t('pwa_info.tag', 'Tecnologia Moderna')}
          </span>
          <h1 className={`text-3xl font-bold tracking-tight sm:text-5xl mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {t('pwa_info.title', 'O que é uma PWA?')}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('pwa_info.subtitle', 'Progressive Web Apps são a nova geração de aplicações: sem downloads pesados, sem atualizações manuais e com performance instantânea.')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-16">
          {features.map((feature) => (
            <div 
              key={feature.key}
              className={`p-6 rounded-2xl border transition-all hover:shadow-md ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDarkTheme ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {t(`pwa_info.features.${feature.key}.title`)}
              </h3>
              <p className={`leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                {t(`pwa_info.features.${feature.key}.desc`)}
              </p>
            </div>
          ))}
        </div>

        <div className={`p-8 rounded-3xl overflow-hidden relative ${isDarkTheme ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'}`}>
          <div className="relative z-10">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {t('pwa_info.how_to_install.title', 'Como instalar?')}
            </h2>
            <p className={`mb-6 text-lg ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              {t('pwa_info.how_to_install.desc', 'Não precisa de procurar na loja de aplicativos. Basta abrir o TimelyOne no seu navegador (Chrome ou Safari) e procurar a opção "Adicionar ao Ecrã Principal".')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className={`flex-1 p-4 rounded-xl ${isDarkTheme ? 'bg-black/20' : 'bg-white/60'}`}>
                <span className="font-semibold block mb-1">Android (Chrome)</span>
                <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Menu (⋮) &rarr; Instalar App</span>
              </div>
              <div className={`flex-1 p-4 rounded-xl ${isDarkTheme ? 'bg-black/20' : 'bg-white/60'}`}>
                <span className="font-semibold block mb-1">iOS (Safari)</span>
                <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Partilhar &rarr; Adicionar ao Ecrã Principal</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className={`mt-12 border-t py-8 text-center text-sm ${isDarkTheme ? 'border-slate-800 text-slate-400 bg-slate-950/50' : 'border-slate-200 text-slate-500 bg-slate-100'}`}>
        <p>&copy; {currentYear} Criativo Devs. All rights reserved.</p>
      </footer>
    </div>
  );
}
