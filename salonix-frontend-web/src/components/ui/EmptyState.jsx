import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-border bg-brand-surface p-10 text-center">
      <div className="mb-2 text-base font-medium text-brand-surfaceForeground">{title}</div>
      {description && (
        <p className="mb-4 max-w-md text-sm text-brand-surfaceForeground/70">{description}</p>
      )}
      {action}
    </div>
  );
}
