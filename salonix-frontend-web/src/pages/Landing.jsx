import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SimpleThemeToggle from '../components/ui/SimpleThemeToggle';

const plans = [
  {
    name: 'Basic',
    price: '€29',
    cadence: 'por mês',
    tagline: 'Comece a digitalizar o seu negócio',
    highlights: [
      'PWA Admin*',
      'Relatórios básicos',
      'Notificações por email',
      'Pronto para crescer com a sua equipa',
    ],
  },
  {
    name: 'Standard',
    price: '€59',
    cadence: 'por mês',
    tagline: 'Escale com automações inteligentes',
    highlights: [
      'Tudo do Basic',
      'PWA Cliente*',
      'Web push notifications',
      '100 SMS/mês incluídos',
    ],
    featured: true,
    extra: 'Inclui 100 SMS (equivalente a €4,50 em créditos)',
  },
  {
    name: 'Pro',
    price: '€99',
    cadence: 'por mês',
    tagline: 'White-label completo e automação total',
    highlights: [
      'Tudo do Standard',
      'branding próprio (white-label)',
      '500 SMS/mês incluídos',
      'WhatsApp ilimitado + domínio personalizado',
    ],
    extra: 'Inclui 500 SMS (≈€22,50) + WhatsApp ilimitado (estimativa €5–10)',
  },
  {
    name: 'Enterprise',
    price: '€199',
    cadence: 'por mês',
    tagline: 'Para redes multi-unidade e integrações avançadas',
    highlights: [
      'Tudo do Pro',
      'Apps nativas iOS/Android',
      'SMS ilimitado',
      'Suporte prioritário + API customizada',
    ],
    extra: 'SMS ilimitado + integrações personalizadas para grandes operações',
  },
];

const highlights = [
  'Configure profissionais, serviços e horários em minutos.',
  'Agendamentos online 24/7 com confirmação automática.',
  'Reduza faltas com lembretes por email, SMS ou WhatsApp.',
  'Escalável de freelancers até franquias com múltiplas unidades.',
  'Dados protegidos e compatíveis com RGPD.',
  'Equipa Criativo Devs disponível para apoiar o seu negócio.',
];

const audiences = [
  'Salões de beleza',
  'Barbearias',
  'Estúdios de tatuagem',
  'Clínicas de estética',
  'Profissionais independentes',
];

function Landing() {
  const { isAuthenticated } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Detecta preferência do sistema ao carregar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkTheme(mediaQuery.matches);
    
    const handleChange = (e) => setIsDarkTheme(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100' 
        : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900'
    }`}>
      <header className={`sticky top-0 z-10 border-b backdrop-blur transition-colors duration-300 ${
        isDarkTheme 
          ? 'border-slate-700 bg-slate-900/70' 
          : 'border-white/60 bg-white/70'
      }`}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className={`flex items-center gap-2 text-lg font-semibold transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
              isDarkTheme 
                ? 'bg-slate-100 text-slate-900' 
                : 'bg-slate-900 text-white'
            }`}>
              Criativo Devs
            </span>
            <span>TimelyOne</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <SimpleThemeToggle 
              isDark={isDarkTheme} 
              onToggle={toggleTheme}
              className="mr-2"
            />
            <Link
              to="/login"
              className={`font-medium transition hover:opacity-80 ${
                isDarkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className={`rounded-full px-4 py-2 font-semibold transition hover:opacity-90 ${
                isDarkTheme 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'bg-slate-900 text-white'
              }`}
            >
              Registar
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-24 text-center">
            <p className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
              isDarkTheme 
                ? 'bg-slate-100/10 text-slate-300' 
                : 'bg-slate-900/10 text-slate-700'
            }`}>
              Gestão e Agendamento Inteligente
            </p>
            <h1 className={`text-4xl font-bold tracking-tight md:text-5xl transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-100' : 'text-slate-900'
            }`}>
              A plataforma completa para modernizar o seu negócio
            </h1>
            <p className={`max-w-2xl text-lg transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Criado pela Criativo Devs, o TimelyOne digitaliza salões,
              barbearias e estúdios com agenda online, notificações automáticas
              e relatórios em tempo real — tudo num único painel fácil de usar.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className={`group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90 ${
                  isDarkTheme 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'bg-slate-900 text-white'
                }`}
              >
                Começar período trial
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#planos"
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition hover:opacity-80 ${
                  isDarkTheme 
                    ? 'border-slate-600 text-slate-300 hover:border-slate-500' 
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                Ver planos e preços
              </a>
            </div>
          </div>
        </section>

        <section className={`transition-colors duration-300 ${
          isDarkTheme ? 'bg-slate-800' : 'bg-white'
        }`}>
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item}
                className={`flex items-start gap-3 rounded-xl border p-5 shadow-sm transition-colors duration-300 ${
                  isDarkTheme 
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300' 
                    : 'border-slate-200 bg-white/80 text-slate-700'
                }`}
              >
                <CheckCircle className="mt-1 h-5 w-5 text-emerald-500" />
                <p className="text-sm">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-semibold">Planos e preços</h2>
              <p className="mt-2 text-sm text-slate-300">
                Escolha o pacote que melhor se adapta ao seu negócio. Pode mudar
                de plano a qualquer momento.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:border-white/40 ${
                    plan.featured ? 'ring-2 ring-emerald-400' : ''
                  }`}
                >
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
                      {plan.tagline}
                    </p>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <p className="text-sm text-slate-300">{plan.cadence}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-200">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.extra ? (
                      <p className="mt-4 text-xs font-medium uppercase tracking-widest text-emerald-200/80">
                        {plan.extra}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    to="/register"
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
                  >
                    Experimentar este plano
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`transition-colors duration-300 ${
          isDarkTheme ? 'bg-slate-900' : 'bg-white'
        }`}>
          <div className="mx-auto grid max-w-4xl gap-4 px-4 py-16 text-center sm:grid-cols-2">
            {audiences.map((audience) => (
              <div
                key={audience}
                className={`rounded-xl border px-6 py-8 text-sm font-medium shadow-sm transition-colors duration-300 ${
                  isDarkTheme 
                    ? 'border-slate-700 bg-slate-800 text-slate-300' 
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {audience}
              </div>
            ))}
          </div>
        </section>

        <section className={`transition-colors duration-300 ${
          isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h2 className={`text-3xl font-semibold transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Criado pela Criativo Devs
            </h2>
            <p className={`mt-4 text-base transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Somos uma equipa apaixonada por tecnologia e experiência do
              cliente. O TimelyOne leva a digitalização a negócios locais com
              uma plataforma robusta, intuitiva e acessível — pronta para
              atender salões e estúdios em Portugal e além.
            </p>
            <p className={`mt-2 text-xs transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-400' : 'text-slate-500'
            }`}>
              *PWA (Aplicação Web Progressiva): instale o TimelyOne como um app
              no telemóvel ou no computador, com ícone próprio e acesso rápido,
              sem depender das lojas tradicionais.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className={`rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90 ${
                  isDarkTheme 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'bg-slate-900 text-white'
                }`}
              >
                Criar conta gratuita
              </Link>
              <Link
                to="/login"
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition hover:opacity-80 ${
                  isDarkTheme 
                    ? 'border-slate-600 text-slate-300 hover:border-slate-500' 
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={`border-t transition-colors duration-300 ${
        isDarkTheme 
          ? 'border-slate-700 bg-slate-900' 
          : 'border-slate-200 bg-white'
      }`}>
        <div className={`mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-6 text-sm md:flex-row transition-colors duration-300 ${
          isDarkTheme ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <p>
            © {new Date().getFullYear()} Criativo Devs. Todos os direitos
            reservados.
          </p>
          <div className="flex gap-4">
            <a href="#planos" className="transition hover:text-slate-800">
              Planos
            </a>
            <Link to="/login" className="transition hover:text-slate-800">
              Entrar
            </Link>
            <Link to="/register" className="transition hover:text-slate-800">
              Registar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
