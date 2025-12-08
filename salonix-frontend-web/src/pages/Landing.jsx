import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Star,
  HelpCircle,
  Calendar,
  Users,
  Bell,
  Smartphone,
  BarChart3,
  Building2,
  Globe,
  Plug,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SimpleThemeToggle from '../components/ui/SimpleThemeToggle';
import { PLAN_OPTIONS } from '../api/billing';
import Modal from '../components/ui/Modal';

const plans = PLAN_OPTIONS.map((p) => ({
  name: p.name,
  price: p.price,
  highlights: p.highlights,
  code: p.code,
}));

const metrics = [
  { value: '+52%', label: 'Clientes a reservar online' },
  { value: '-30%', label: 'Tempo perdido ao telefone' },
  { value: '+41%', label: 'Receita média por cliente' },
  { value: '99.98%', label: 'Uptime e fiabilidade' },
];

const niches = [
  { title: 'Salões de Beleza', desc: 'Serviços e durações diferentes' },
  { title: 'Barbearias', desc: 'Rotação rápida de cadeiras' },
  { title: 'Tatuagem', desc: 'Sessões longas e depósitos' },
  { title: 'Estética', desc: 'Pacotes e salas de tratamento' },
  { title: 'Freelancers', desc: 'Visão simples, tudo num lugar' },
];

const faqs = [
  {
    q: 'Como funciona o período trial?',
    a: 'Durante 14 dias tens acesso total ao TimelyOne, sem limites de agendamentos ou profissionais. Não é necessário cartão. Ao final, escolhes um plano ou simplesmente não continuas.',
  },
  {
    q: 'Posso mudar de plano a qualquer momento?',
    a: 'Sim. A alteração é imediata e não perdes nenhum dado. Upgrades desbloqueiam funcionalidades no mesmo instante.',
  },
  {
    q: 'Preciso de cartão de crédito para começar?',
    a: 'Não. O registo é simples e sem compromisso.',
  },
  {
    q: 'O TimelyOne funciona no telemóvel?',
    a: 'Sim. Disponibilizamos uma PWA para equipa e clientes, instalável em iPhone e Android como uma app normal, sem depender das lojas.',
  },
  {
    q: 'Posso usar o meu próprio domínio?',
    a: 'Sim, disponível nos planos Pro e Enterprise. Permite personalização completa da identidade visual.',
  },
  {
    q: 'Como funcionam os créditos de SMS/WhatsApp?',
    a: 'Cada plano inclui um valor mensal em créditos. Lembretes automáticos debitam esse saldo conforme o envio. Quando termina, podes recarregar no painel.',
  },
  {
    q: 'O TimelyOne é compatível com o RGPD?',
    a: 'Sim. Dados encriptados, servidores compatíveis com normas europeias e possibilidade de exportação/eliminação de dados.',
  },
  {
    q: 'É possível migrar dados do meu sistema atual?',
    a: 'Sim. Suportamos importação de clientes, serviços e horários através de ficheiros CSV.',
  },
  {
    q: 'Quantos profissionais posso adicionar?',
    a: 'Ilimitados em todos os planos.',
  },
  {
    q: 'Os clientes podem cancelar ou remarcar sozinhos?',
    a: 'Sim. Cada marcação inclui um link seguro para remarcar ou cancelar, reduzindo chamadas e tempo perdido.',
  },
  {
    q: 'O TimelyOne envia lembretes automáticos?',
    a: 'Sim. Email, SMS e WhatsApp — configuráveis conforme antecedência desejada.',
  },
  {
    q: 'O sistema suporta várias unidades/filiais?',
    a: 'Sim, nos planos Pro e Enterprise: gestão multiunidade, permissões avançadas e relatórios consolidados.',
  },
  {
    q: 'A minha equipa pode ter acessos diferentes?',
    a: 'Sim. Perfis de permissão: administrador, gestor e profissional.',
  },
  {
    q: 'Posso ver relatórios de faturação e desempenho?',
    a: 'Sim. O painel inclui métricas de faturação, ocupação, serviços mais vendidos, desempenho por profissional e muito mais.',
  },
  {
    q: 'Quanto tempo leva para configurar tudo?',
    a: 'Entre 10 e 20 minutos, dependendo da quantidade de serviços e profissionais.',
  },
];

const screenshots = [
  { label: 'Agenda diária', src: '/screenshots/agenda.png' },
  { label: 'Lista de clientes', src: '/screenshots/clientes.png' },
  { label: 'Relatório mensal', src: '/screenshots/relatorio.png' },
  {
    label: 'Configuração de profissionais',
    src: '/screenshots/profissionais.png',
  },
  { label: 'PWA cliente', src: '/screenshots/pwa-cliente.png' },
];

function Landing() {
  const { isAuthenticated } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const screenshotsRef = useRef(null);
  const [screenshotsProgress, setScreenshotsProgress] = useState(0);
  const [activeShot, setActiveShot] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (i) => {
    setOpenFaqIndex((prev) => (prev === i ? null : i));
  };

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

  const onScreenshotsScroll = () => {
    const el = screenshotsRef.current;
    if (!el) return;
    const max = Math.max(el.scrollWidth - el.clientWidth, 1);
    setScreenshotsProgress(el.scrollLeft / max);
  };

  const scrollScreenshots = (dir) => {
    const el = screenshotsRef.current;
    if (!el) return;
    const step = Math.max(Math.floor(el.clientWidth * 0.8), 240);
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#0f0f0f] text-[#f5f5f5]' : 'bg-white text-[#111827]'
      }`}
    >
      <header
        className={`sticky top-0 z-10 border-b backdrop-blur transition-colors duration-300 ${
          isDarkTheme
            ? 'border-slate-700 bg-slate-900/70'
            : 'border-white/60 bg-white/70'
        }`}
      >
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className={`flex items-center gap-2 text-lg font-semibold transition-colors duration-300 ${
              isDarkTheme ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                isDarkTheme
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-slate-900 text-white'
              }`}
            >
              Criativo Devs
            </span>
            <span>TimelyOne</span>
          </Link>

          <div className="hidden sm:flex items-center gap-4 text-sm">
            <SimpleThemeToggle
              isDark={isDarkTheme}
              onToggle={toggleTheme}
              className="mr-2"
            />
            <Link
              to="/client/enter"
              className={`font-medium transition hover:opacity-80 ${
                isDarkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Área do Cliente
            </Link>
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
              className={`font-medium transition hover:opacity-80 ${
                isDarkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Registar
            </Link>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <SimpleThemeToggle
              isDark={isDarkTheme}
              onToggle={toggleTheme}
              className="mr-1"
            />
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={`flex items-center gap-1 font-medium transition hover:opacity-80 ${
                isDarkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              Menu
            </button>
            {mobileMenuOpen && (
              <div
                id="landing-mobile-menu"
                role="menu"
                className={`absolute right-4 top-full mt-2 w-56 rounded-lg border shadow-lg ${
                  isDarkTheme
                    ? 'border-[#2d2d2d] bg-[#181818] text-slate-200'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <Link
                  to="/client/enter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-medium hover:opacity-80"
                  role="menuitem"
                >
                  Área do Cliente
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-medium hover:opacity-80"
                  role="menuitem"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-medium hover:opacity-80"
                  role="menuitem"
                >
                  Registar
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-24 text-center">
            <p
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                isDarkTheme
                  ? 'bg-slate-100/10 text-slate-300'
                  : 'bg-slate-900/10 text-slate-700'
              }`}
            >
              Gestão e Agendamento Inteligente
            </p>
            <h1
              className={`text-4xl font-bold tracking-tight md:text-5xl transition-colors duration-300 ${
                isDarkTheme ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              A plataforma premium de agendamento e gestão para negócios modernos.
            </h1>
            <p
              className={`max-w-2xl text-lg transition-colors duration-300 ${
                isDarkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              O TimelyOne automatiza horários, reduz faltas, melhora a
              experiência dos clientes e profissionaliza a operação do seu negócio
              — tudo num painel rápido, elegante e pronto para equipas de
              qualquer dimensão.
            </p>
            <ul className="mt-2 grid max-w-2xl gap-2 text-sm sm:grid-cols-2">
              {[
                'Reduza faltas até 35% com lembretes automáticos.',
                'Agendamentos 24/7, mesmo fora do horário.',
                'Interface intuitiva para equipa e clientes.',
                'Pronto para escalar: freelancers → franquias.',
              ].map((b) => (
                <li
                  key={b}
                  className={`${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className={`font-semibold bg-clip-text text-transparent ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500'
                }`}
              >
                Começar período trial (14 dias)
              </Link>
              <a
                href="#pricing"
                className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'}`}
              >
                Ver planos e preços
              </a>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-3xl font-semibold text-center">
              Resultados que falam por si.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className={`rounded-lg border p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <TrendingUp className="mx-auto h-6 w-6 text-emerald-500" />
                  <p className="mt-3 text-2xl font-bold">{m.value}</p>
                  <p
                    className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${isDarkTheme ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2
              className={`text-3xl font-semibold text-center ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
            >
              O dia a dia do seu negócio não precisa ser caótico.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div
                className={`order-2 sm:order-1 rounded-lg border p-6 transition-colors duration-300 ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
              >
                <ul
                  className={`${isDarkTheme ? 'text-slate-300' : 'text-slate-700'} space-y-2 text-sm`}
                >
                  <li>Ligações constantes a pedir horários</li>
                  <li>Confusão com agendas diferentes</li>
                  <li>Profissionais a gerir reservas no telemóvel</li>
                  <li>Faltas de clientes sem aviso</li>
                  <li>Clientes frustrados ao tentar remarcar</li>
                  <li>Falta de visibilidade sobre desempenho e faturação</li>
                </ul>
              </div>
              <div
                className={`order-1 sm:order-2 rounded-lg border p-6 transition-colors duration-300 ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
              >
                <p
                  className={`text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}
                >
                  TimelyOne resolve tudo automaticamente:
                </p>
                <ul
                  className={`${isDarkTheme ? 'text-slate-300' : 'text-slate-700'} mt-3 space-y-2 text-sm`}
                >
                  <li>Agenda unificada para toda a equipa</li>
                  <li>Agendamentos online para clientes</li>
                  <li>Sincronização automática entre unidades</li>
                  <li>Lembretes automáticos por email / SMS / WhatsApp</li>
                  <li>Painel com KPIs, fluxo diário e histórico</li>
                  <li>
                    Relatórios inteligentes: faturação, serviços, horários,
                    ocupação
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className={isDarkTheme ? 'bg-[#0f0f0f]' : 'bg-slate-900 text-white'}
        >
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-3xl font-semibold text-center">
              Veja antes de experimentar.
            </h2>
            <p
              className={`mt-2 text-center text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-200'}`}
            >
              Usabilidade pensada ao detalhe. Rápido, intuitivo e pronto para
              qualquer equipa.
            </p>
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => scrollScreenshots('prev')}
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => scrollScreenshots('next')}
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Seguinte
                </button>
              </div>
              <div
                ref={screenshotsRef}
                onScroll={onScreenshotsScroll}
                className="mt-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
              >
                <div className="flex gap-4 py-2">
                  {screenshots.map((shot) => (
                    <div
                      key={shot.label}
                      className={`min-w-[280px] snap-start rounded-xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-white/20 bg-white/10'} group cursor-zoom-in`}
                      onClick={() => setActiveShot(shot)}
                    >
                      <div className="h-40 w-full overflow-hidden rounded-lg">
                        <img
                          src={shot.src}
                          alt={shot.label}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <p
                        className={`mt-3 text-center text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-200'}`}
                      >
                        {shot.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-1 rounded bg-white/20">
                <div
                  className="h-1 rounded bg-indigo-400"
                  style={{ width: `${Math.round(screenshotsProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {activeShot ? (
          <Modal
            open={!!activeShot}
            onClose={() => setActiveShot(null)}
            title={activeShot.label}
            size="lg"
          >
            <img
              src={activeShot.src}
              alt={activeShot.label}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
            <div className="mt-4 text-right">
              <a
                href={activeShot.src}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-indigo-300 hover:text-indigo-200"
              >
                Abrir em nova aba
              </a>
            </div>
          </Modal>
        ) : null}

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2
              className={`text-3xl font-semibold text-center ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
            >
              A sua operação, totalmente digital.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Calendar,
                  title: 'Agendamentos 24/7',
                  desc: 'Reservas online a qualquer hora, com confirmação automática.',
                },
                {
                  icon: Users,
                  title: 'Gestão de Equipa',
                  desc: 'Horários, folgas, salas, cadeiras e mais.',
                },
                {
                  icon: Bell,
                  title: 'Lembretes Inteligentes',
                  desc: 'Email, SMS e WhatsApp para reduzir faltas.',
                },
                {
                  icon: Smartphone,
                  title: 'PWA Equipa e Clientes',
                  desc: 'Instalável no telemóvel, sem lojas tradicionais.',
                },
                {
                  icon: BarChart3,
                  title: 'Relatórios em Tempo Real',
                  desc: 'Faturação, ocupação e serviços mais vendidos.',
                },
                {
                  icon: Building2,
                  title: 'Escalável para Franquias',
                  desc: 'Permissões e relatórios consolidados.',
                },
                {
                  icon: Globe,
                  title: 'Domínio Personalizado (Pro)',
                  desc: 'Marca e URL próprios.',
                },
                {
                  icon: Plug,
                  title: 'Integrações (Enterprise)',
                  desc: 'Google Calendar, Stripe e mais.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={`rounded-lg border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <f.icon
                    className={`h-5 w-5 ${isDarkTheme ? 'text-indigo-300' : 'text-indigo-600'}`}
                  />
                  <h4
                    className={`mt-3 text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
                  >
                    {f.title}
                  </h4>
                  <p
                    className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-semibold">
                Planos claros. Sem taxas escondidas.
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Escolha o plano que acompanha o crescimento do seu negócio.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.code}
                  className={`flex h-full flex-col rounded-2xl bg-white/5 p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
                    plan.code === 'standard'
                      ? 'border border-indigo-400/50 ring-1 ring-indigo-400/40'
                      : 'border border-white/10 hover:border-white/40'
                  }`}
                >
                  <div className="flex-1 space-y-3">
                    {plan.code === 'standard' && (
                      <span className="inline-block rounded-full border border-white/20 px-2 py-1 text-xs text-white">
                        Mais escolhido
                      </span>
                    )}
                    {plan.code === 'enterprise' && (
                      <span className="inline-block rounded-full border border-white/20 px-2 py-1 text-xs text-white">
                        Em breve
                      </span>
                    )}
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.code === 'enterprise' ? (
                    <span className="mt-6 inline-block font-medium text-slate-300">
                      Em breve
                    </span>
                  ) : (
                    <Link
                      to="/register"
                      className="mt-6 font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      Iniciar 14 dias grátis
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2
              className={`text-3xl font-semibold text-center ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
            >
              Começar é simples.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  n: 1,
                  title: 'Crie a sua conta.',
                  desc: 'Sem cartão, sem compromisso.',
                },
                {
                  n: 2,
                  title: 'Configure a equipa e serviços.',
                  desc: 'Tudo pronto em minutos.',
                },
                {
                  n: 3,
                  title: 'Ative os agendamentos online.',
                  desc: 'Os clientes começam a reservar.',
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className={`rounded-lg border p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${isDarkTheme ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}
                  >
                    {step.n}
                  </div>
                  <h4
                    className={`mt-3 text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold">
              Criado para negócios reais.
            </h2>
            <p
              className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Adapta-se ao seu fluxo — seja qual for o setor.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {niches.map((n) => (
                <div
                  key={n.title}
                  className={`rounded-lg border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <h4 className="text-sm font-semibold">{n.title}</h4>
                  <p
                    className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    {n.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-3xl font-semibold text-center">
              Profissionais reais. Resultados reais.
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                'Reduzimos as faltas em 40% no primeiro mês.',
                'A minha equipa deixou de gerir horários no WhatsApp.',
                'O painel é rápido, intuitivo e realmente profissional.',
              ].map((q, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <Star className="h-5 w-5 text-amber-500" />
                  <p
                    className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {q}
                  </p>
                </div>
              ))}
            </div>
            <p
              className={`mt-6 text-center text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Avaliação média: ★ 4.9 / 5.0
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-3xl font-semibold text-center">FAQ</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {faqs.map((item, i) => {
                const isOpen = openFaqIndex === i;
                const panelId = `faq-panel-${i}`;
                const buttonId = `faq-button-${i}`;
                return (
                  <div
                    key={item.q}
                    className={`rounded-lg border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-controls={panelId}
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        <span className="font-medium text-indigo-300 hover:text-indigo-200">
                          {item.q}
                        </span>
                      </span>
                      <ArrowRight
                        className={`h-4 w-4 text-indigo-300 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="mt-2"
                      hidden={!isOpen}
                    >
                      <p
                        className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className={isDarkTheme ? 'bg-[#0f0f0f]' : 'bg-slate-900 text-white'}
        >
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h2 className="text-3xl font-semibold">
              Segurança e privacidade de nível profissional.
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'Compatível com RGPD',
                'Dados encriptados',
                'Backups recorrentes',
                'Infraestrutura escalável',
                'Alojamento europeu opcional',
              ].map((s) => (
                <div
                  key={s}
                  className={`rounded-lg border p-6 ${isDarkTheme ? 'border-[#2d2d2d] bg-[#181818]' : 'border-white/20 bg-white/10'}`}
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <p className="mt-2 text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold">
              Crie a sua conta gratuita — leve o seu salão para o próximo nível.
            </h2>
            <Link
              to="/register"
              className={`mt-4 inline-block font-semibold bg-clip-text text-transparent ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500'
              }`}
            >
              Começar agora (14 dias grátis)
            </Link>
          </div>
        </section>
      </main>

      <footer
        className={`border-t transition-colors duration-300 ${
          isDarkTheme
            ? 'border-slate-700 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-6 text-sm md:flex-row transition-colors duration-300 ${
            isDarkTheme ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <p>
            © {new Date().getFullYear()} Criativo Devs. Todos os direitos
            reservados.
          </p>
          <div className="flex gap-4">
            <a href="#pricing" className="transition hover:opacity-80">
              Planos
            </a>
            <Link
              to="/client/enter"
              className="transition hover:text-slate-800"
            >
              Área do Cliente
            </Link>
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
