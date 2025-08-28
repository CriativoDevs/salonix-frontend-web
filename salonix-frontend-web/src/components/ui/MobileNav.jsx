import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  XIcon,
  StarIcon,
  SettingsIcon,
} from 'lucide-react';

function MobileNav() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Links principais (sempre visíveis)
  const mainLinks = [
    { to: '/dashboard', icon: HomeIcon, label: t('nav.home') },
    { to: '/slots', icon: CalendarIcon, label: t('nav.slots') },
    { to: '/profile', icon: UserIcon, label: t('nav.profile') },
  ];

  // Links do menu expandido (novas funcionalidades)
  const expandedLinks = [
    { to: '/chat', icon: MessageCircleIcon, label: t('nav.chat') },
    { to: '/feedback', icon: StarIcon, label: t('nav.feedback') },
    { to: '/settings', icon: SettingsIcon, label: t('nav.settings') },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Navegação principal fixa */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-md flex justify-around items-center py-2 md:hidden z-50">
        {mainLinks.map(({ to, icon: IconComponent, label }) => {
          const Icon = IconComponent;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs transition-colors ${
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {label}
            </NavLink>
          );
        })}

        {/* Botão hamburger para expandir */}
        <button
          onClick={toggleMenu}
          className={`flex flex-col items-center justify-center text-xs transition-all duration-200 ${
            isMenuOpen
              ? 'text-brand font-semibold scale-110'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {isMenuOpen ? (
            <XIcon className="h-5 w-5 mb-0.5" />
          ) : (
            <MoreHorizontalIcon className="h-5 w-5 mb-0.5" />
          )}
          {isMenuOpen ? t('nav.close') : t('nav.more')}
        </button>
      </nav>

      {/* Menu expandido (overlay) com animação */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden z-40 ${
          isMenuOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      >
        <div
          className={`absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 transform ${
            isMenuOpen
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-4 opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            {expandedLinks.map(({ to, icon: IconComponent, label }) => {
              const Icon = IconComponent;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-brand-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-50 transition-colors">
                    <Icon className="h-6 w-6 text-gray-600 group-hover:text-brand-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>

          <button
            onClick={toggleMenu}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors border-t border-gray-100 pt-4"
          >
            {t('nav.close')}
          </button>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
