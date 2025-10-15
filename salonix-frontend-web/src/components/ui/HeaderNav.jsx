import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircleIcon, StarIcon, SettingsIcon } from 'lucide-react';
import BrandLogo from './BrandLogo';
import Container from './Container';
import DropdownMenu from './DropdownMenu';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';

export default function HeaderNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { tenant, branding } = useTenant();

  const displayName = tenant?.name || 'TimelyOne';

  // Links principais (sempre visíveis)
  const mainLinks = [
    { to: '/slots', label: 'Slots' },
    { to: '/professionals', label: 'Profissionais' },
    { to: '/bookings', label: 'Agendamentos' },
    { to: '/customers', label: 'Clientes' },
    { to: '/services', label: 'Serviços' },
  ];

  // Links do menu hamburger (novas funcionalidades)
  const dropdownItems = [
    // Chat e Feedback desativados por enquanto
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: SettingsIcon,
    },
  ];

  const base = 'rounded-md px-3 py-2 text-sm font-medium transition';
  const inactive = 'text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground';
  const active = 'text-brand-surfaceForeground bg-brand-light ring-1 ring-brand-border';

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

            {/* Menu hamburger com novas funcionalidades */}
            <DropdownMenu
              items={dropdownItems}
              trigger={
                <div className="flex items-center space-x-2">
                  <span>{t('nav.more')}</span>
                </div>
              }
            />
          </nav>

          <div className="flex items-center gap-2">
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
