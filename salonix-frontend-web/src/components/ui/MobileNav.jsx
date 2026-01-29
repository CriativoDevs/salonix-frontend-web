import { useState, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  CalendarIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  XIcon,
  StarIcon,
  SettingsIcon,
  UsersIcon,
  BarChartIcon,
  ClockIcon,
  LogOutIcon,
  LockIcon,
} from 'lucide-react';
import useFeatureLock from '../../hooks/useFeatureLock';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

// Componente auxiliar para links móveis com verificação de bloqueio
function MobileNavLinkWithLock({
  to,
  icon: IconComponent,
  label,
  featureKey,
  onClick,
}) {
  const { t } = useTranslation();
  const { isLocked, requiredTier } = useFeatureLock(featureKey);
  const Icon = IconComponent;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border hover:bg-brand-light hover:border-brand-border hover:shadow-md transition-all duration-200 group relative"
      title={
        isLocked
          ? t('upgrade.available_in_plan', {
              plan: requiredTier,
              defaultValue: `Disponível no plano ${requiredTier}`,
            })
          : ''
      }
    >
      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-light/80 transition-colors relative">
        <Icon className="h-6 w-6 text-brand-surfaceForeground group-hover:text-brand-primary" />
        {isLocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-surface rounded-full flex items-center justify-center border border-brand-border">
            <LockIcon className="h-2.5 w-2.5 text-brand-surfaceForeground/60" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-brand-surfaceForeground group-hover:text-brand-surfaceForeground underline underline-offset-4 text-center">
        {label}
      </span>
    </NavLink>
  );
}

function MobileNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { tenant, branding } = useTenant();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = tenant?.name || 'TimelyOne';

  // Determinar papel do usuário atual - usar staff_role do backend
  const currentUserRole = useMemo(() => {
    // O backend retorna staff_role diretamente no user
    return user?.staff_role || null;
  }, [user]);

  const mainLinks = useMemo(() => {
    return [
      { to: '/dashboard', icon: HomeIcon, label: t('nav.home') },
      {
        to: '/bookings',
        icon: CalendarIcon,
        label: t('nav.bookings', 'Agendamentos'),
      },
      {
        to: '/slots',
        icon: ClockIcon,
        label: t('nav.slots', 'Horários'),
      },
    ];
  }, [t]);

  // Links do menu expandido (filtrados por permissão)
  const expandedLinks = useMemo(() => {
    const allLinks = [
      {
        to: '/customers',
        icon: UsersIcon,
        label: t('nav.customers', 'Clientes'),
        featureKey: null, // Clientes disponível para todos
      },
      {
        to: '/team',
        icon: UsersIcon,
        label: t('nav.team', 'Equipe'),
        roles: ['owner', 'manager'],
        featureKey: null, // Team sem restrição de plano
      },
      {
        to: '/reports',
        icon: BarChartIcon,
        label: t('nav.reports', 'Relatórios'),
        roles: ['owner'], // Relatórios apenas para owner
        featureKey: 'enableBasicReports', // Verifica acesso a relatórios
      },
      {
        to: '/feedback',
        icon: StarIcon,
        label: t('nav.feedback', 'Feedback'),
        roles: ['owner'],
        featureKey: null,
      },
      {
        to: '/plans',
        icon: StarIcon,
        label: t('nav.plans', 'Planos'),
        roles: ['owner'],
        featureKey: null,
      },
      {
        to: '/settings',
        icon: SettingsIcon,
        label: t('nav.settings'),
        roles: ['owner'],
        featureKey: null,
      },
    ];

    return allLinks.filter(
      (link) => !link.roles || link.roles.includes(currentUserRole)
    );
  }, [t, currentUserRole]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Navegação principal fixa */}
      <nav className="fixed bottom-0 left-0 w-full bg-brand-surface border-t border-brand-border shadow-md flex justify-around items-center py-2 pb-[env(safe-area-inset-bottom)] md:hidden z-50">
        {mainLinks.map(({ to, icon: IconComponent, label }) => {
          const Icon = IconComponent;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs transition-colors ${
                  isActive
                    ? 'text-brand-primary font-semibold underline underline-offset-4'
                    : 'text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {label}
            </NavLink>
          );
        })}

        {/* Botão hamburger para expandir - só aparece se houver itens expandidos */}
        {expandedLinks.length > 0 && (
          <button
            onClick={toggleMenu}
            className={`flex flex-col items-center justify-center text-xs transition-all duration-200 ${
              isMenuOpen
                ? 'text-brand-primary font-semibold scale-110'
                : 'text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground'
            }`}
          >
            {isMenuOpen ? (
              <XIcon className="h-5 w-5 mb-0.5" />
            ) : (
              <MoreHorizontalIcon className="h-5 w-5 mb-0.5" />
            )}
            {isMenuOpen ? t('nav.close') : t('nav.more')}
          </button>
        )}
      </nav>

      {/* Menu expandido (overlay) com animação */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden z-40 ${
          isMenuOpen ? 'bg-opacity-70' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      >
        <div
          className={`absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 max-h-[75vh] flex flex-col bg-brand-surface border border-brand-border rounded-xl shadow-2xl transition-all duration-300 transform origin-bottom ${
            isMenuOpen
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-4 opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do menu fixo */}
          <div className="flex-none flex items-center justify-between p-4 pb-2 border-b border-brand-border/50 bg-brand-surface rounded-t-xl">
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-2 py-1 transition hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
              aria-label={t('nav.go_to_dashboard', 'Ir para o dashboard')}
            >
              <BrandLogo
                variant="inline"
                size={28}
                textClassName="text-base font-semibold text-brand-surfaceForeground"
                name={displayName}
                logoUrl={branding?.logoUrl}
              />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />

              {/* Logout button for mobile - apenas para manager e collaborator */}
              {currentUserRole && currentUserRole !== 'owner' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="rounded-md p-2 text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground transition"
                  title={t('nav.logout', 'Sair')}
                  aria-label={t('nav.logout', 'Sair')}
                >
                  <LogOutIcon size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Área de conteúdo rolável */}
          <div className="flex-1 overflow-y-auto p-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              {expandedLinks.map(({ to, icon, label, featureKey }) => (
                <MobileNavLinkWithLock
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  featureKey={featureKey}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
