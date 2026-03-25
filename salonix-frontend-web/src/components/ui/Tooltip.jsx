import React from 'react';

/**
 * Tooltip component with hover support
 * @param {Object} props
 * @param {string} props.tooltip - Tooltip text to display
 * @param {React.ReactNode} props.children - Content that triggers the tooltip
 * @param {string} [props.position='top'] - Position: 'top', 'bottom', 'left', 'right'
 * @param {string} [props.className=''] - Additional classes for the trigger element
 */
export default function Tooltip({
  tooltip,
  children,
  position = 'top',
  className = '',
}) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2',
    bottom: 'bottom-full left-1/2 -translate-x-1/2',
    left: 'left-full top-1/2 -translate-y-1/2',
    right: 'right-full top-1/2 -translate-y-1/2',
  };

  return (
    <div className={`group relative inline-block ${className}`}>
      {children}
      <div
        className={`
          absolute z-[70] hidden group-hover:block group-focus-within:block
          ${positionClasses[position]}
          w-64 max-w-[75vw] rounded-lg border border-slate-300/20
          bg-slate-950/95 px-3 py-2 text-[12px] font-medium leading-relaxed text-slate-100
          shadow-2xl backdrop-blur-sm whitespace-normal
          pointer-events-none
        `}
      >
        {tooltip}
        <div
          className={`
            absolute h-2 w-2 rotate-45 border border-slate-300/20 bg-slate-950/95
            ${arrowClasses[position]}
          `}
        />
      </div>
    </div>
  );
}
