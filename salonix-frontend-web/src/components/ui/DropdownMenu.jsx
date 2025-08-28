import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDownIcon } from 'lucide-react';

function DropdownMenu({ items, trigger, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 hover:text-gray-900"
      >
        {trigger}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown com animação */}
      <div
        className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 transition-all duration-200 transform origin-top-right ${
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
                `flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150 hover:text-gray-900 group ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border-r-2 border-brand-500'
                    : ''
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
