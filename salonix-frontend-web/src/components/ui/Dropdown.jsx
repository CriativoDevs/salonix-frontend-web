import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({ trigger, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={handleToggle}>
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-brand-surface border border-brand-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" onClick={handleItemClick}>
            {children}
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