import React from 'react';

export default function ScheduleCheckIcon({
  size = 48,
  className = '',
  strokeWidth = 1.8,
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* aro do relógio */}
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* ponteiros */}
      <path
        d="M12 12 V7.25"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12 12 L15.75 13.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* check de confirmação (agendamento) */}
      <path
        d="M8.5 14.5 L11 17 L16 11.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
