import React, { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';
import Container from './Container';
import ThemeToggle from './ThemeToggle';
import { useTenant } from '../../hooks/useTenant';
import { resolveTenantAssetUrl } from '../../utils/tenant';

export default function ClientHeaderNav() {
  const { t } = useTranslation();
  const { tenant, branding } = useTenant();
  const displayName = tenant?.name || branding?.appName || 'TimelyOne';
  const logoUrl = resolveTenantAssetUrl(branding?.logoUrl);

  const mainLinks = useMemo(() => {
    return [
      {
        to: '/client/appointments',
        label: t('client.nav.appointments', 'Agendamentos'),
      },
      { to: '/client/profile', label: t('client.nav.profile', 'Perfil') },
    ];
  }, [t]);

  const base = 'rounded-md px-3 py-2 text-sm font-medium transition';
  const inactive =
    'text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground';
  const active =
    'text-brand-surfaceForeground bg-brand-light ring-1 ring-brand-border';

  return (
    <header className="hidden md:block bg-brand-surface shadow-sm ring-1 ring-brand-border relative z-20 overflow-visible">
      <Container className="overflow-visible">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/client/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
            aria-label={t(
              'client.nav.go_to_dashboard',
              'Ir para a área do cliente'
            )}
          >
            <BrandLogo
              variant="inline"
              size={22}
              textClassName="text-base font-semibold text-brand-surfaceForeground"
              name={displayName}
              logoUrl={logoUrl}
            />
          </Link>

          <nav className="relative flex items-center gap-1 overflow-visible">
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
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
