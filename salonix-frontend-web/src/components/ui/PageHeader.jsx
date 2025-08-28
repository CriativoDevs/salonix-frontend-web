import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {/* ações (botões, filtros, etc.) */}
      {children ? (
        <div className="flex items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
