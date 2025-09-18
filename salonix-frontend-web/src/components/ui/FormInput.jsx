import React from 'react';

export default function FormInput({
  label,
  error,
  description,
  className = '',
  inputClassName = '',
  ...props
}) {
  const inputClasses = [
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm',
    'text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
    error ? 'border-rose-400' : 'border-gray-200',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input className={inputClasses} {...props} />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : (
        description && <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
