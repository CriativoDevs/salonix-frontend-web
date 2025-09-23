// src/components/ui/BrandLogo.jsx
import React from 'react';

export default function BrandLogo({
  name = 'TimelyOne',
  variant = 'stacked',
  size = 56,
  className = '',
  logoUrl = null,
  iconClassName = 'text-brand-primary',
  textClassName = 'text-xl font-semibold tracking-wide text-gray-800',
}) {
  const Icon = logoUrl ? (
    <img
      src={logoUrl}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="h-auto w-auto max-h-14 object-contain"
    />
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={iconClassName}
      aria-hidden="true"
    >
      {/* aro do relógio */}
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" />
      {/* ponteiros */}
      <path
        d="M12 12 V7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 12 L16 13.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* check */}
      <path
        d="M8.5 14.5 L11 17 L16 11.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
        aria-label={`${name} logo`}
      >
        {Icon}
        <span className={textClassName}>{name}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      aria-label={`${name} logo`}
    >
      {Icon}
      <span className={`mt-2 ${textClassName}`}>{name}</span>
    </div>
  );
}
