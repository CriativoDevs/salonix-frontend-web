import React from 'react';

export default function TableLoadingSpinner({ rows = 5, columns = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-brand-surfaceForeground/10 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}