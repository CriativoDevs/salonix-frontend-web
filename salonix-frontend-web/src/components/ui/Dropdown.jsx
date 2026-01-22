import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function Dropdown({
  trigger,
  children,
  items = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
  align = 'right',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [position, setPosition] = useState('bottom');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Calculate position
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const minHeight = 200; // Aproximadamente a altura máxima do dropdown

        if (spaceBelow < minHeight && spaceAbove > spaceBelow) {
          setPosition('top');
        } else {
          setPosition('bottom');
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 50);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    } else {
      setSearchTerm(''); // Reset search when closed
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  const filteredItems = useMemo(() => {
    if (!searchable || !searchTerm) return items;
    return items.filter((item) =>
      String(item.label).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchable, searchTerm]);

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <div onClick={handleToggle}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${
            position === 'top'
              ? 'bottom-full mb-2 origin-bottom-right'
              : 'mt-2 origin-top-right'
          } z-50 w-56 rounded-md border border-brand-border bg-brand-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
        >
          {searchable && (
            <div className="border-b border-brand-border p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-brand-surfaceForeground/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full rounded-md border border-brand-border bg-brand-surface py-1.5 pl-8 pr-3 text-sm text-brand-surfaceForeground placeholder:text-brand-surfaceForeground/50 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div
            className="max-h-60 overflow-y-auto py-1"
            onClick={handleItemClick}
          >
            {items.length > 0 ? (
              filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <DropdownItem
                    key={index}
                    onClick={(e) => {
                      item.onClick && item.onClick(e);
                    }}
                    className={item.className}
                  >
                    {item.label}
                  </DropdownItem>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-brand-surfaceForeground/70">
                  {searchable ? 'Nenhum resultado' : ''}
                </div>
              )
            ) : (
              children
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        block w-full px-4 py-2 text-left text-sm text-brand-surfaceForeground 
        hover:bg-brand-light transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}
