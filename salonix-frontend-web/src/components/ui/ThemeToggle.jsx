import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { THEMES } from '../../constants/themes';
import { SunIcon, MoonIcon, SystemIcon } from './icons/ThemeIcons';

const ThemeToggle = ({ className = '' }) => {
  const { theme, changeTheme, isLoading } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const check = () => {
      try {
        setIsMobile(window.matchMedia('(max-width: 640px)').matches);
      } catch {
        setIsMobile(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Configuração dos temas
  const themeOptions = [
    {
      value: THEMES.LIGHT,
      label: 'Claro',
      icon: SunIcon,
      description: 'Tema claro',
    },
    {
      value: THEMES.DARK,
      label: 'Escuro',
      icon: MoonIcon,
      description: 'Tema escuro',
    },
    {
      value: THEMES.SYSTEM,
      label: 'Sistema',
      icon: SystemIcon,
      description: 'Seguir preferência do sistema',
    },
  ];

  const currentTheme = themeOptions.find((option) => option.value === theme);
  const CurrentIcon = currentTheme?.icon || SystemIcon;

  const handleThemeChange = async (newTheme) => {
    try {
      await changeTheme(newTheme);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao alterar tema:', error);
      // Aqui poderia mostrar uma notificação de erro
    }
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <button
          className="flex items-center justify-center p-2 rounded-lg bg-brand-light border border-brand-border opacity-50 cursor-not-allowed"
          disabled
        >
          <div className="w-5 h-5 animate-pulse bg-gray-400 rounded"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-0 bg-transparent border-0 text-brand-primary underline underline-offset-4 hover:text-brand-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        title={`Tema atual: ${currentTheme?.label || 'Sistema'}`}
        aria-label="Alterar tema"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 ${isMobile ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 bg-brand-surface border border-brand-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto`}
        >
          <div className="py-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center px-4 py-2 text-sm hover:bg-brand-light transition-colors duration-150 ${
                    isSelected
                      ? 'bg-brand-light text-brand-surfaceForeground font-medium'
                      : 'text-brand-surfaceForeground'
                  }`}
                  role="menuitem"
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-brand-surfaceForeground">
                      {option.label}
                    </div>
                    <div className="text-xs text-brand-surfaceForeground/80">
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-brand-primary rounded-full ml-2 flex-shrink-0"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
