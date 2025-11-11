import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PaginationControls({
  totalCount = 0,
  limit = 10,
  offset = 0,
  onChangeLimit,
  onPrev,
  onNext,
  className = '',
}) {
  const { t } = useTranslation();
  const start = totalCount === 0 ? 0 : Math.min(offset + 1, totalCount);
  const end = Math.min(offset + limit, totalCount);
  const canPrev = offset > 0;
  const canNext = offset + limit < totalCount;
  const options = [10, 25, 75, 100];

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="text-sm text-brand-surfaceForeground/70">
        {t('pagination.summary', 'Mostrando')} {start}
        {'–'}
        {end} {t('pagination.of', 'de')} {totalCount}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-brand-surfaceForeground/70">
          {t('pagination.page_size', 'Itens por página')}
        </label>
        <select
          value={limit}
          onChange={(e) => onChangeLimit?.(parseInt(e.target.value, 10))}
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-primary)'
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="rounded border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground disabled:opacity-50"
          >
            {t('pagination.prev', 'Anterior')}
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="rounded bg-brand-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('pagination.next', 'Próximo')}
          </button>
        </div>
      </div>
    </div>
  );
}