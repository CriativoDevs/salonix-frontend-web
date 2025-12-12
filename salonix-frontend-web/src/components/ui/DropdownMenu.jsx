import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ChevronDownIcon } from 'lucide-react';

function DropdownMenu({ items, trigger, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-brand-surfaceForeground/70 transition-all duration-200 hover:bg-brand-light hover:text-brand-surfaceForeground"
        aria-label={t('nav.open_menu', 'Abrir menu')}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown com animação */}
      <div
        className={`absolute right-0 mt-2 w-56 rounded-xl bg-brand-surface text-brand-surfaceForeground shadow-xl ring-1 ring-brand-border z-50 transition-all duration-200 transform origin-top-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="py-2">
          {items.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-light text-brand-surfaceForeground border-r-2 border-brand-primary'
                    : 'text-brand-surfaceForeground/80 hover:bg-brand-light hover:text-brand-surfaceForeground'
                }`
              }
              style={{
                animationDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              {item.icon && (
                <item.icon
                  className={`w-4 h-4 mr-3 transition-colors duration-150 ${
                    isOpen
                      ? 'text-gray-600 group-hover:text-gray-900'
                      : 'text-gray-400'
                  }`}
                />
              )}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DropdownMenu;
