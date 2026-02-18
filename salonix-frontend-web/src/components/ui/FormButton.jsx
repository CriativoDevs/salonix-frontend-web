import React from 'react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  link: 'btn-link',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
};

export default function FormButton({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  loading = false,
  children,
  ...props
}) {
  const base = 'font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary';
  const isDisabled = disabled || loading;
  
  const disabledClasses = isDisabled
    ? 'opacity-60 cursor-not-allowed hover:bg-inherit focus:ring-0'
    : '';

  const classes = [
    base,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={isDisabled} {...props}>
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
}
