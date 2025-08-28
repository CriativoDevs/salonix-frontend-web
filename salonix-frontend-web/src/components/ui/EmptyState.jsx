import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
      <div className="mb-2 text-base font-medium text-gray-900">{title}</div>
      {description && (
        <p className="mb-4 max-w-md text-sm text-gray-500">{description}</p>
      )}
      {action}
    </div>
  );
}
