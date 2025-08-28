import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircleIcon, StarIcon, SettingsIcon } from 'lucide-react';
import BrandLogo from './BrandLogo';
import Container from './Container';
import DropdownMenu from './DropdownMenu';

export default function HeaderNav() {
  const { t } = useTranslation();

  // Links principais (sempre visíveis)
  const mainLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/slots', label: 'Slots' },
    { to: '/professionals', label: 'Profissionais' },
    { to: '/bookings', label: 'Agendamentos' },
    { to: '/services', label: 'Serviços' },
  ];

  // Links do menu hamburger (novas funcionalidades)
  const dropdownItems = [
    {
      to: '/chat',
      label: t('nav.chat'),
      icon: MessageCircleIcon,
    },
    {
      to: '/feedback',
      label: t('nav.feedback'),
      icon: StarIcon,
    },
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: SettingsIcon,
    },
  ];

  const base = 'rounded-md px-3 py-2 text-sm font-medium transition';
  const inactive = 'text-gray-600 hover:bg-gray-100';
  const active = 'text-gray-900 ring-1 ring-brand-border';

  return (
    <header className="hidden md:block bg-white shadow-sm ring-1 ring-gray-200">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <BrandLogo
            variant="inline"
            size={22}
            textClassName="text-base font-semibold text-gray-900"
          />

          <nav className="flex items-center gap-1">
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

          <div className="w-6" />
        </div>
      </Container>
    </header>
  );
}
