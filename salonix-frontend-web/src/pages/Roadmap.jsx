import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, CircleDot, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchRoadmap } from '../api/cms';

const STATUS_ORDER = ['delivered', 'in_progress', 'planned'];

const STATUS_CONFIG = {
  delivered: {
    icon: CheckCircle2,
    dark: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    light: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  in_progress: {
    icon: CircleDot,
    dark: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
    light: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-400',
  },
  planned: {
    icon: Clock,
    dark: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    light: 'text-slate-500 bg-slate-100 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function Roadmap() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkTheme(mq.matches);
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!localStorage.getItem('landing-theme')) setIsDarkTheme(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.title = t('cms.roadmap.page_title', 'Roadmap | TimelyOne');
    fetchRoadmap()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { document.title = 'TimelyOne'; };
  }, [t]);

  const dark = isDarkTheme;

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    const group = items.filter((i) => i.status === status);
    if (group.length > 0) acc[status] = group;
    return acc;
  }, {});

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
          {t('cms.roadmap.title', 'Roadmap')}
        </h1>
        <p className={`mb-12 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('cms.roadmap.subtitle', 'O que já entregámos e o que vem a seguir.')}
        </p>

        {loading && <RoadmapSkeleton dark={dark} />}

        {!loading && error && (
          <p className={`text-center py-16 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('cms.roadmap.error', 'Erro ao carregar o roadmap. Tenta novamente mais tarde.')}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className={`text-center py-16 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('cms.roadmap.empty', 'Nenhum item no roadmap de momento.')}
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-12">
            {Object.entries(grouped).map(([status, groupItems]) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const badgeClass = dark ? config.dark : config.light;
              const label = t(`cms.roadmap.status.${status}`, status);

              return (
                <section key={status}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    <div className={`flex-1 h-px ${dark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  </div>

                  <ul className="space-y-3">
                    {groupItems.map((item) => (
                      <li
                        key={item.title}
                        className={`flex items-start gap-4 rounded-xl border p-5 ${
                          dark
                            ? 'border-slate-700 bg-slate-800/60'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dot}`} />
                        <div>
                          <p className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <div className={`mt-16 rounded-2xl border p-8 text-center ${dark ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50'}`}>
            <p className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t('cms.roadmap.cta_title', 'Quer acesso antecipado às próximas funcionalidades?')}
            </p>
            <Link
              to="/register"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              {t('cms.roadmap.cta_button', 'Começar agora (14 dias grátis)')}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function RoadmapSkeleton({ dark }) {
  const base = dark ? 'bg-slate-800' : 'bg-slate-200';
  return (
    <div className="animate-pulse space-y-10">
      {[1, 2].map((g) => (
        <div key={g} className="space-y-3">
          <div className={`h-6 w-32 rounded-full ${base}`} />
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-16 rounded-xl ${base}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
