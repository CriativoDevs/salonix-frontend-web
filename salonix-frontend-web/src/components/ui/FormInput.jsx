import React, { useId } from 'react';

export default function FormInput({
  label,
  error,
  description,
  className = '',
  inputClassName = '',
  ...props
}) {
  const generatedId = useId();
  const { id: providedId, ...rest } = props;
  const inputId = providedId || generatedId;

  const inputClasses = [
    'w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm',
    'text-brand-surfaceForeground placeholder-brand-surfaceForeground/50',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
    error ? 'border-rose-400' : 'border-brand-border',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-brand-surfaceForeground">
          {label}
        </label>
      )}
      <input 
        id={inputId} 
        className={inputClasses} 
        {...rest} 
      />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : (
        description && <p className="text-xs text-brand-surfaceForeground/60">{description}</p>
      )}
    </div>
  );
}
