import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCmsPages } from '../api/cms';

export default function CmsPage() {
  const { t } = useTranslation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
      if (!localStorage.getItem('landing-theme')) setIsDarkTheme(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.title = t('cms.list.page_title', 'Como funciona | TimelyOne');
    fetchCmsPages()
      .then(setPages)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { document.title = 'TimelyOne'; };
  }, [t]);

  const dark = isDarkTheme;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${dark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-md ${dark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${dark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('cms.back_home', 'Voltar ao início')}
          </Link>
          <span className={`font-bold text-xl tracking-tight ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            TimelyOne
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t('cms.list.title', 'Como funciona')}
        </h1>
        <p className={`mb-10 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('cms.list.subtitle', 'Tudo o que precisas de saber sobre a plataforma.')}
        </p>

        {loading && <ListSkeleton dark={dark} />}

        {!loading && error && (
          <p className={`text-center py-16 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('cms.error', 'Erro ao carregar o conteúdo. Tenta novamente mais tarde.')}
          </p>
        )}

        {!loading && !error && pages.length === 0 && (
          <p className={`text-center py-16 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('cms.list.empty', 'Nenhum conteúdo disponível de momento.')}
          </p>
        )}

        {!loading && !error && pages.length > 0 && (
          <ul className="space-y-4">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  to={`/como-funciona/${page.slug}`}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-5 transition-all hover:shadow-md ${
                    dark
                      ? 'border-slate-700 bg-slate-800 hover:border-indigo-500'
                      : 'border-slate-200 bg-white hover:border-indigo-400'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-semibold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {page.title}
                    </p>
                    {page.summary && (
                      <p className={`mt-1 text-sm line-clamp-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {page.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`h-5 w-5 flex-shrink-0 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ListSkeleton({ dark }) {
  const base = dark ? 'bg-slate-800' : 'bg-slate-200';
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`h-20 rounded-xl ${base}`} />
      ))}
    </div>
  );
}
