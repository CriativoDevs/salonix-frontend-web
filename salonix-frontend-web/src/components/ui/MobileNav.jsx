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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { useStaff } from '../../hooks/useStaff';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

function MobileNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tenant, branding, slug } = useTenant();
  const { staff } = useStaff({ slug });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName = tenant?.name || 'TimelyOne';

  // Determinar papel do usuário atual
  const currentUserRole = useMemo(() => {
    if (!Array.isArray(staff) || !user) {
      return null;
    }

    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;

    const match = staff.find((member) => {
      const memberEmail =
        typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername =
        typeof member.username === 'string'
          ? member.username.toLowerCase()
          : null;

      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });

    return match?.role || null;
  }, [staff, user]);

  const mainLinks = useMemo(() => {
    const base = [
      { to: '/dashboard', icon: HomeIcon, label: t('nav.home') },
      {
        to: '/bookings',
        icon: CalendarIcon,
        label: t('nav.bookings', 'Agendamentos'),
      },
    ];
    if (currentUserRole === 'owner') {
      base.push({
        to: '/settings',
        icon: SettingsIcon,
        label: t('nav.settings'),
      });
    }
    return base;
  }, [t, currentUserRole]);

  // Links do menu expandido (filtrados por permissão)
  const expandedLinks = useMemo(() => {
    const allLinks = [
      { to: '/slots', icon: CalendarIcon, label: t('nav.slots') },
      {
        to: '/customers',
        icon: UsersIcon,
        label: t('nav.customers', 'Clientes'),
      },
      {
        to: '/team',
        icon: UsersIcon,
        label: t('nav.team', 'Equipe'),
        roles: ['owner', 'manager'],
      },
      { to: '/chat', icon: MessageCircleIcon, label: t('nav.chat') },
      {
        to: '/feedback',
        icon: StarIcon,
        label: t('nav.feedback', 'Feedback'),
        roles: ['owner'],
      },
      {
        to: '/plans',
        icon: StarIcon,
        label: t('nav.plans', 'Planos'),
        roles: ['owner'],
      },
      {
        to: '/settings',
        icon: SettingsIcon,
        label: t('nav.settings'),
        roles: ['owner'],
      },
    ];

    return allLinks.filter(
      (link) => !link.roles || link.roles.includes(currentUserRole)
    );
  }, [t, currentUserRole]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Navegação principal fixa */}
      <nav className="fixed bottom-0 left-0 w-full bg-brand-surface border-t border-brand-border shadow-md flex justify-around items-center py-2 md:hidden z-50">
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
          className={`absolute bottom-20 left-4 right-4 bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-6 transition-all duration-300 transform ${
            isMenuOpen
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-4 opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {expandedLinks.map(({ to, icon: IconComponent, label }) => {
                const Icon = IconComponent;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border hover:bg-brand-light hover:border-brand-border hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-light/80 transition-colors">
                      <Icon className="h-6 w-6 text-brand-surfaceForeground group-hover:text-brand-primary" />
                    </div>
                    <span className="text-sm font-medium text-brand-surfaceForeground group-hover:text-brand-surfaceForeground underline underline-offset-4 text-center">
                      {label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-brand-border pt-4 space-y-2">
            <button
              onClick={toggleMenu}
              className="w-full py-3 text-sm text-brand-surfaceForeground underline underline-offset-4 hover:text-brand-primary transition-colors"
            >
              {t('nav.close')}
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 text-sm font-medium text-rose-600 underline underline-offset-4 transition-colors hover:text-rose-700"
            >
              {t('nav.logout', 'Sair')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
