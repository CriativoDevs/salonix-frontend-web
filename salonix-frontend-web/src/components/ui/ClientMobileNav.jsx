import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, CalendarIcon, UserIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function ClientMobileNav() {
  const { t } = useTranslation();

  const items = [
    {
      to: '/client/dashboard',
      icon: HomeIcon,
      label: t('client.nav.home', 'Início'),
    },
    {
      to: '/client/appointments',
      icon: CalendarIcon,
      label: t('client.nav.appointments', 'Agendamentos'),
    },
    {
      to: '/client/profile',
      icon: UserIcon,
      label: t('client.nav.profile', 'Perfil'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-brand-border bg-brand-surface px-2 py-2">
      {items.map((entry) => {
        const Icon = entry.icon;
        return (
          <NavLink
            key={entry.to}
            to={entry.to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1 text-xs transition',
                isActive
                  ? 'text-brand-surfaceForeground'
                  : 'text-brand-surfaceForeground/70',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" />
            <span>{entry.label}</span>
          </NavLink>
        );
      })}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}
