import React from 'react';
import { useTranslation } from 'react-i18next';
import { exportBasicReportsCSV } from '../../api/reports';
import { useExportJob, EXPORT_STATUS } from '../../hooks/useExportJob';

const ExportButton = ({ filters, disabled = false }) => {
  const { t } = useTranslation();
  const { status, error, startExport, download, reset } = useExportJob(
    exportBasicReportsCSV,
    'relatorios-basicos-{date}.csv'
  );

  const isPending = status === EXPORT_STATUS.PENDING;
  const isReady = status === EXPORT_STATUS.READY;
  const isError = status === EXPORT_STATUS.ERROR;
  const isExpired = status === EXPORT_STATUS.EXPIRED;

  if (isReady) {
    return (
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4 text-green-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="text-sm text-green-600 font-medium">
          {t('reports.export.ready', 'Pronto!')}
        </span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            download();
          }}
          className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center underline"
        >
          <svg
            className="w-4 h-4 mr-1 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {t('reports.export.download', 'Baixar CSV')}
        </a>
        <button
          onClick={reset}
          className="text-xs text-brand-surfaceForeground/50 hover:text-brand-surfaceForeground/80 transition-colors"
          title={t('reports.export.dismiss', 'Fechar')}
        >
          ✕
        </button>
      </span>
    );
  }

  if (isError) {
    return (
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4 text-red-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={reset}
          className="text-xs text-brand-surfaceForeground/50 hover:text-brand-surfaceForeground/80 transition-colors"
        >
          {t('reports.export.retry', 'Tentar novamente')}
        </button>
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4 text-amber-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-amber-600">
          {t('reports.export.expired', 'Exportação expirada.')}
        </span>
        <button
          onClick={reset}
          className="text-xs text-brand-surfaceForeground/50 hover:text-brand-surfaceForeground/80 transition-colors"
        >
          {t('reports.export.retry', 'Tentar novamente')}
        </button>
      </span>
    );
  }

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled && !isPending) startExport(filters);
      }}
      className={`text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center ${
        disabled || isPending
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer'
      }`}
    >
      {isPending ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {t('reports.export.preparing', 'Preparando...')}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {t('reports.export.csv', 'Exportar CSV')}
        </>
      )}
    </a>
  );
};

export default ExportButton;
