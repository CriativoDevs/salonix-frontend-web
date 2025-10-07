import React from 'react';

export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-brand-surface p-5 text-brand-surfaceForeground shadow-sm ring-1 ring-brand-border">
      <div className="text-sm text-brand-surfaceForeground/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-brand-surfaceForeground">{value}</div>
      {hint && <div className="mt-1 text-xs text-brand-surfaceForeground/70">{hint}</div>}
    </div>
  );
}
