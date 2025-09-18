import React from 'react';

const variants = {
  primary: 'bg-brand-primary hover:bg-brand-hover text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  outline: 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
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
  children,
  ...props
}) {
  const base = 'font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary';
  const disabledClasses = disabled
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
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
