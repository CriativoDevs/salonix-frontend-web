import React, { useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageCircleIcon,
  StarIcon,
  SettingsIcon,
  BarChart3Icon,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import Container from './Container';
import DropdownMenu from './DropdownMenu';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { useStaff } from '../../hooks/useStaff';
import i18n from '../../i18n';

export default function HeaderNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tenant, branding, slug } = useTenant();
  const { staff } = useStaff({ slug });

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
  }, [t, currentUserRole, i18n.language]);

  // Links do menu hamburger (filtrados por permissão)
  const dropdownItems = useMemo(() => {
    const allItems = [
      {
        to: '/feedback',
        label: t('nav.feedback', 'Feedback'),
        icon: StarIcon,
        roles: ['owner'],
      },
      {
        to: '/reports',
        label: t('nav.reports', 'Relatórios'),
        icon: BarChart3Icon,
        roles: ['owner'],
      },
      {
        to: '/plans',
        label: t('nav.plans', 'Planos'),
        icon: StarIcon,
        roles: ['owner'],
      },
      {
        to: '/settings',
        label: t('nav.settings'),
        icon: SettingsIcon,
        roles: ['owner'],
      },
    ];

    return allItems.filter(
      (item) => !item.roles || item.roles.includes(currentUserRole)
    );
  }, [t, currentUserRole, i18n.language]);

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
    <header className="hidden md:block bg-brand-surface shadow-sm ring-1 ring-brand-border relative z-20 overflow-visible">
      <Container className="overflow-visible">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
            aria-label={t('nav.go_to_dashboard', 'Ir para o dashboard')}
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
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [base, isActive ? active : inactive].join(' ')
                }
              >
                {l.label}
              </NavLink>
            ))}

            {/* Menu hamburger com novas funcionalidades - só aparece se houver itens */}
            {dropdownItems.length > 0 && (
              <DropdownMenu
                items={dropdownItems}
                trigger={
                  <div className="flex items-center space-x-2">
                    <span>{t('nav.more')}</span>
                  </div>
                }
              />
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-surfaceForeground transition hover:bg-brand-light"
            >
              {t('nav.logout', 'Sair')}
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}
