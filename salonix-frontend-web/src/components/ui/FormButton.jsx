import React from 'react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
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
