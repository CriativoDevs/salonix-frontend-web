import React from 'react';

export default function FormInput({
  label,
  error,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={[
          'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm',
          'text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary',
          error ? 'ring-2 ring-rose-400' : '',
          inputClassName,
        ].join(' ')}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
