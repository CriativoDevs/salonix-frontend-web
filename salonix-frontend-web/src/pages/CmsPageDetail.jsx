import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { fetchCmsPage } from '../api/cms';

export default function CmsPageDetail() {
  const { slug } = useParams();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
    if (!slug) return;

    setLoading(true);
    setNotFound(false);
    setError(false);

    fetchCmsPage(slug)
      .then((data) => {
        setPage(data);

        const title = data.seo?.meta_title || data.title || 'TimelyOne';
        document.title = `${title} | TimelyOne`;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = data.seo?.meta_description || data.summary || '';
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));

    return () => { document.title = 'TimelyOne'; };
  }, [slug]);

  const dark = isDarkTheme;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${dark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-md ${dark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            to="/como-funciona"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${dark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Como funciona
          </Link>
          <span className={`font-bold text-xl tracking-tight ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            TimelyOne
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {loading && <PageSkeleton dark={dark} />}

        {!loading && notFound && (
          <div className="text-center py-24">
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Esta página não está disponível de momento.
            </p>
            <Link
              to="/como-funciona"
              className="mt-6 inline-block text-indigo-500 hover:text-indigo-400 text-sm font-medium"
            >
              Ver todos os conteúdos
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24">
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ocorreu um erro ao carregar o conteúdo. Tenta novamente mais tarde.
            </p>
          </div>
        )}

        {!loading && page && (
          <article>
            <h1 className={`text-4xl font-bold leading-tight mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
              {page.title}
            </h1>

            {page.summary && (
              <p className={`text-xl leading-relaxed mb-8 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                {page.summary}
              </p>
            )}

            {page.image && (
              <img
                src={page.image}
                alt={page.title}
                className="w-full rounded-xl mb-10 object-cover max-h-96"
              />
            )}

            <div
              className={`prose prose-lg max-w-none ${dark ? 'prose-invert' : ''}`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {page.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

function PageSkeleton({ dark }) {
  const base = dark ? 'bg-slate-800' : 'bg-slate-200';
  return (
    <div className="animate-pulse space-y-6">
      <div className={`h-10 w-2/3 rounded ${base}`} />
      <div className={`h-5 w-full rounded ${base}`} />
      <div className={`h-5 w-5/6 rounded ${base}`} />
      <div className={`h-64 w-full rounded-xl ${base}`} />
      <div className={`h-4 w-full rounded ${base}`} />
      <div className={`h-4 w-full rounded ${base}`} />
      <div className={`h-4 w-3/4 rounded ${base}`} />
    </div>
  );
}
