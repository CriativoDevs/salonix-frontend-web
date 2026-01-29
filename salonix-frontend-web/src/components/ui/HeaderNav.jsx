import React, { useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageCircleIcon,
  StarIcon,
  SettingsIcon,
  BarChart3Icon,
  LogOutIcon,
  LockIcon,
} from 'lucide-react';
import useFeatureLock from '../../hooks/useFeatureLock';
import BrandLogo from './BrandLogo';
import Container from './Container';
import DropdownMenu from './DropdownMenu';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import i18n from '../../i18n';

// Componente auxiliar para links com verificação de bloqueio
function NavLinkWithLock({ to, label, featureKey, className, dataTour }) {
  const { t } = useTranslation();
  const { isLocked, requiredTier } = useFeatureLock(featureKey);

  const tooltipText = isLocked
    ? t('upgrade.available_in_plan', {
        plan: requiredTier,
        defaultValue: `Disponível no plano ${requiredTier}`,
      })
    : '';

  return (
    <div className="relative group">
      <NavLink
        to={to}
        className={className}
        data-tour={dataTour}
        title={tooltipText}
      >
        {label}
        {isLocked && (
          <LockIcon className="ml-1.5 h-3.5 w-3.5 inline-block text-brand-surfaceForeground/50" />
        )}
      </NavLink>
      {isLocked && tooltipText && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

export default function HeaderNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { tenant, branding } = useTenant();
  const navigate = useNavigate();

  const displayName = tenant?.name || 'TimelyOne';

  // Determinar papel do usuário atual - usar staff_role do backend
  const currentUserRole = useMemo(() => {
    // O backend retorna staff_role diretamente no user
    return user?.staff_role || null;
  }, [user]);

  // Links principais (filtrados por permissão)
  const mainLinks = useMemo(() => {
    const allLinks = [
      { to: '/slots', label: t('nav.slots', 'Slots') },
      { to: '/bookings', label: t('nav.bookings', 'Agendamentos') },
      {
        to: '/services',
        label: t('nav.services', 'Serviços'),
        roles: ['owner', 'manager'],
      },
      { to: '/customers', label: t('nav.customers', 'Clientes') },
      {
        to: '/team',
        label: t('nav.team', 'Equipe'),
        roles: ['owner', 'manager'],
      },
    ];

    return allLinks.filter(
      (link) => !link.roles || link.roles.includes(currentUserRole)
    );
  }, [t, currentUserRole]);

  // Links do menu hamburger (filtrados por permissão)
  const dropdownItems = useMemo(() => {
    const allItems = [
      {
        to: '/feedback',
        label: t('nav.feedback', 'Feedback'),
        icon: StarIcon,
        roles: ['owner'],
        featureKey: null, // Feedback disponível para todos os planos
      },
      {
        to: '/reports',
        label: t('nav.reports', 'Relatórios'),
        icon: BarChart3Icon,
        roles: ['owner'],
        featureKey: 'enableBasicReports', // Verifica acesso a relatórios
      },
      {
        to: '/plans',
        label: t('nav.plans', 'Planos'),
        icon: StarIcon,
        roles: ['owner'],
        featureKey: null, // Página de planos sempre acessível
      },
      {
        to: '/settings',
        label: t('nav.settings'),
        icon: SettingsIcon,
        roles: ['owner'],
        featureKey: null, // Settings sempre acessível
      },
    ];

    return allItems.filter(
      (item) => !item.roles || item.roles.includes(currentUserRole)
    );
  }, [t, currentUserRole]);

  const base = 'rounded-md px-3 py-2 text-sm font-medium transition';
  const inactive =
    'text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground';
  const active =
    'text-brand-surfaceForeground bg-brand-light ring-1 ring-brand-border';

  useEffect(() => {
    try {
      const stored =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('salonix_lang')
          : '';
      const hasStored = stored === 'pt' || stored === 'en';
      const defaultLang = String(tenant?.profile?.language || '')
        .trim()
        .toLowerCase();
      if (!hasStored && (defaultLang === 'pt' || defaultLang === 'en')) {
        if (i18n.language !== defaultLang) {
          i18n.changeLanguage(defaultLang);
        }
      }
    } catch {
      /* noop */
    }
  }, [tenant]);

  return (
    <header className="hidden md:block bg-brand-surface shadow-sm ring-1 ring-brand-border relative z-20 overflow-visible sticky top-0">
      <Container className="overflow-visible">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
            aria-label={t('nav.go_to_dashboard', 'Ir para o dashboard')}
            data-tour="nav-dashboard"
          >
            <BrandLogo
              variant="inline"
              size={22}
              textClassName="text-base font-semibold text-brand-surfaceForeground"
              name={displayName}
              logoUrl={branding?.logoUrl}
            />
          </Link>

          <nav className="relative flex items-center gap-1 overflow-visible">
            {/* Links principais */}
            {mainLinks.map((l) => (
              <NavLinkWithLock
                key={l.to}
                to={l.to}
                label={l.label}
                featureKey={l.featureKey}
                className={({ isActive }) =>
                  [base, isActive ? active : inactive].join(' ')
                }
                dataTour={`nav-${l.to.replace('/', '')}`}
              />
            ))}

            {/* Menu hamburger com novas funcionalidades - só aparece se houver itens */}
            {dropdownItems.length > 0 && (
              <div data-tour="nav-more">
                <DropdownMenu
                  items={dropdownItems}
                  trigger={
                    <div className="flex items-center space-x-2">
                      <span>{t('nav.more')}</span>
                    </div>
                  }
                />
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />

            {/* Logout button - visible apenas para manager e collaborator (owner usa Settings) */}
            {currentUserRole && currentUserRole !== 'owner' && (
              <button
                onClick={() => {
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
      </Container>
    </header>
  );
}
